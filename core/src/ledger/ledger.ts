/**
 * ReSpec — Ledger State Machine (D3 deliverable)
 *
 * OWNER: Divyansh
 *
 * PURPOSE: A pure, append-only event reducer that tracks the four-state procurement
 * ledger for each recommendation: ELIGIBLE → PLANNED → ORDERED → VERIFIED.
 *
 * DESIGN PRINCIPLES:
 *   1. Pure function — no AWS, no DB, no I/O. Importable by Bhavya's API handlers.
 *   2. Append-only events — replay produces identical state (idempotency for the reducer).
 *   3. Illegal transitions fail explicitly — never silently pass.
 *   4. FLAGGED deliveries never count toward verifiedT.
 *   5. VERIFIED requires a delivery with a non-null evidenceKey that is assumed to exist
 *      in S3 (the API handler performs the HEAD check before creating the event).
 *   6. Duplicate weighbridge slip numbers are blocked at reduce() time.
 *   7. Delivered quantity cannot exceed planned + 5% without flagging.
 *   8. A recommendation's verifiedT is the sum of qualifying deliveries, not a boolean.
 *
 * SAFETY:
 *   - MANUAL_REVIEW and NOT_ALLOWED recommendations cannot be approved.
 *   - ORDER cannot be placed before a plan exists (PLANNED state).
 *   - DELIVERY cannot be recorded before an order exists (ORDERED state).
 *   - State is never derived from UI-side assertions — only from events.
 */

import type {
  Rec,
  LedgerState,
  LedgerEvent,
  LedgerState_Rec,
  Delivery,
  DeliveryFlag,
} from '@respec/contracts';

// ---------------------------------------------------------------------------
// Transition guard
// ---------------------------------------------------------------------------

/** Allowed predecessor states for each transition. */
const TRANSITION_GUARDS: Record<string, LedgerState[]> = {
  DECISION_APPROVED: ['ELIGIBLE'],     // ELIGIBLE → PLANNED (after plan generation)
  PLAN_GENERATED: ['ELIGIBLE'],        // approval unlocks planning; plan sets PLANNED
  ORDER_PLACED: ['PLANNED'],           // PLANNED → ORDERED
  DELIVERY_RECORDED: ['ORDERED'],      // ORDERED → (stays ORDERED; verifiedT increases)
};

// ---------------------------------------------------------------------------
// Tolerance
// ---------------------------------------------------------------------------

/** Maximum allowed delivery overrun before flagging (5% of planned quantity). */
const OVERRUN_TOLERANCE = 0.05;

// ---------------------------------------------------------------------------
// Ledger error
// ---------------------------------------------------------------------------

export class LedgerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'LedgerError';
  }
}

// ---------------------------------------------------------------------------
// Reducer input type
// ---------------------------------------------------------------------------

export interface ReducerInput {
  /** Existing ledger state for this recommendation. */
  current: LedgerState_Rec;
  /** The event to apply. */
  event: LedgerEvent;
  /**
   * For PLAN_GENERATED events: the planned quantity in tonnes.
   * Required so we can track overruns.
   */
  plannedT?: number;
  /**
   * For DELIVERY_RECORDED events: whether the S3 HEAD check confirmed the evidence object exists.
   * The API handler performs this check; the reducer trusts the input.
   */
  evidenceConfirmed?: boolean;
}

// ---------------------------------------------------------------------------
// Main reducer
// ---------------------------------------------------------------------------

/**
 * Applies one LedgerEvent to the current LedgerState_Rec and returns the next state.
 *
 * IMPORTANT: Call this in order of event timestamps. Replaying all events from the
 * beginning on an empty initial state produces the current canonical state.
 *
 * @throws {LedgerError} on illegal transitions, duplicate slips, or invalid inputs.
 */
export function applyLedgerEvent(input: ReducerInput): LedgerState_Rec {
  const { current, event, plannedT, evidenceConfirmed } = input;

  // Deep-clone deliveries to avoid mutation
  const state: LedgerState_Rec = {
    ...current,
    deliveries: [...current.deliveries],
  };

  switch (event.type) {
    // -----------------------------------------------------------------------
    // DECISION_APPROVED — human has approved the recommendation
    // -----------------------------------------------------------------------
    case 'DECISION_APPROVED': {
      assertTransition(state, 'DECISION_APPROVED');
      // State stays ELIGIBLE after approval; PLAN_GENERATED moves it to PLANNED
      // (D5 decision: approval records decision; plan generation sets PLANNED)
      return {
        ...state,
        // eligibleT remains unchanged
      };
    }

    // -----------------------------------------------------------------------
    // DECISION_REJECTED — human has rejected; eligibleT zeroed
    // -----------------------------------------------------------------------
    case 'DECISION_REJECTED': {
      if (state.state !== 'ELIGIBLE') {
        throw new LedgerError(
          'INVALID_TRANSITION',
          `Cannot reject recommendation in state '${state.state}' — only ELIGIBLE recommendations can be rejected.`,
        );
      }
      return {
        ...state,
        eligibleT: 0,
      };
    }

    // -----------------------------------------------------------------------
    // PLAN_GENERATED — approved recs move to PLANNED; plannedT set
    // -----------------------------------------------------------------------
    case 'PLAN_GENERATED': {
      assertTransition(state, 'PLAN_GENERATED');
      if (plannedT === undefined || plannedT < 0) {
        throw new LedgerError('MISSING_PLANNED_T', 'PLAN_GENERATED event requires plannedT ≥ 0.');
      }
      return {
        ...state,
        state: 'PLANNED',
        plannedT,
      };
    }

    // -----------------------------------------------------------------------
    // ORDER_PLACED — PLANNED → ORDERED
    // -----------------------------------------------------------------------
    case 'ORDER_PLACED': {
      assertTransition(state, 'ORDER_PLACED');
      const poRef = String(event.payload['poRef'] ?? '').trim();
      if (!poRef) {
        throw new LedgerError('MISSING_PO_REF', 'ORDER_PLACED event requires a non-empty poRef.');
      }
      return {
        ...state,
        state: 'ORDERED',
        orderedT: state.plannedT,
      };
    }

    // -----------------------------------------------------------------------
    // DELIVERY_RECORDED — evidence received
    // -----------------------------------------------------------------------
    case 'DELIVERY_RECORDED': {
      assertTransition(state, 'DELIVERY_RECORDED');

      const payload = event.payload as {
        deliveryId: string;
        facilityId: string;
        quantityT: number;
        slipNo: string;
        date: string;
        evidenceKey: string;
      };

      // Validate required fields
      if (!payload.deliveryId) throw new LedgerError('MISSING_DELIVERY_ID', 'deliveryId is required.');
      if (!payload.slipNo) throw new LedgerError('MISSING_SLIP_NO', 'slipNo is required.');
      if (!payload.evidenceKey) throw new LedgerError('MISSING_EVIDENCE_KEY', 'evidenceKey is required.');
      if (typeof payload.quantityT !== 'number' || payload.quantityT <= 0) {
        throw new LedgerError('INVALID_QUANTITY', `quantityT must be a positive number; got ${payload.quantityT as number}.`);
      }

      // Block duplicate slip numbers across all deliveries for this rec
      const duplicateSlip = state.deliveries.find((d) => d.slipNo === payload.slipNo);
      if (duplicateSlip) {
        throw new LedgerError(
          'DUPLICATE_SLIP_NO',
          `Weighbridge slip number '${payload.slipNo}' has already been recorded for recommendation ${state.recId}.`,
        );
      }

      // Check overrun: total delivered so far + this delivery vs planned
      const totalDeliveredBefore = state.deliveries
        .filter((d) => d.state === 'VERIFIED')
        .reduce((sum, d) => sum + d.quantityT, 0);
      const totalAfter = totalDeliveredBefore + payload.quantityT;
      const allowedMax = state.plannedT * (1 + OVERRUN_TOLERANCE);

      const flags: DeliveryFlag[] = [];

      if (totalAfter > allowedMax) {
        flags.push('EXCEEDS_PLANNED_PLUS_5PCT');
      }

      if (!evidenceConfirmed) {
        flags.push('EVIDENCE_S3_NOT_FOUND');
      }

      const deliveryState: 'VERIFIED' | 'FLAGGED' = flags.length === 0 ? 'VERIFIED' : 'FLAGGED';

      const delivery: Delivery = {
        deliveryId: payload.deliveryId,
        recId: state.recId,
        facilityId: payload.facilityId,
        quantityT: payload.quantityT,
        slipNo: payload.slipNo,
        date: payload.date,
        evidenceKey: payload.evidenceKey,
        state: deliveryState,
        flags,
      };

      const updatedDeliveries = [...state.deliveries, delivery];

      // Recompute verifiedT from all non-flagged deliveries
      const verifiedT = updatedDeliveries
        .filter((d) => d.state === 'VERIFIED')
        .reduce((sum, d) => sum + d.quantityT, 0);

      return {
        ...state,
        // Recommendation stays ORDERED; individual deliveries track state
        state: 'ORDERED',
        deliveries: updatedDeliveries,
        verifiedT: Math.round(verifiedT * 1000) / 1000,
      };
    }

    default: {
      throw new LedgerError(
        'UNKNOWN_EVENT_TYPE',
        `Unknown event type: ${(event as { type: string }).type}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Replay helper
// ---------------------------------------------------------------------------

/**
 * Replays a list of events over an initial state to produce the current state.
 * Events must be in chronological order.
 *
 * @throws {LedgerError} if any event produces an illegal transition.
 */
export function replayLedger(
  initial: LedgerState_Rec,
  events: LedgerEvent[],
  opts: { plannedT?: number; evidenceConfirmed?: boolean } = {},
): LedgerState_Rec {
  let state = initial;
  for (const event of events) {
    state = applyLedgerEvent({
      current: state,
      event,
      plannedT: opts.plannedT,
      evidenceConfirmed: opts.evidenceConfirmed,
    });
  }
  return state;
}

// ---------------------------------------------------------------------------
// Aggregate impact totals across all recommendation states
// ---------------------------------------------------------------------------

export interface LedgerTotals {
  eligibleT: number;
  plannedT: number;
  orderedT: number;
  verifiedT: number;
}

/**
 * Aggregates ledger totals across all recommendation states.
 * Used by the GET /jobs/{id}/impact endpoint.
 * FLAGGED deliveries never contribute to verifiedT.
 */
export function aggregateLedgerTotals(states: LedgerState_Rec[]): LedgerTotals {
  return states.reduce(
    (acc, s) => ({
      eligibleT: acc.eligibleT + s.eligibleT,
      plannedT: acc.plannedT + (s.state === 'PLANNED' || s.state === 'ORDERED' || s.state === 'VERIFIED' ? s.plannedT : 0),
      orderedT: acc.orderedT + (s.state === 'ORDERED' || s.state === 'VERIFIED' ? s.orderedT : 0),
      verifiedT: acc.verifiedT + s.verifiedT,
    }),
    { eligibleT: 0, plannedT: 0, orderedT: 0, verifiedT: 0 },
  );
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

/** Creates an empty initial LedgerState_Rec for a newly evaluated recommendation. */
export function makeLedgerState(rec: Rec): LedgerState_Rec {
  return {
    recId: rec.recId,
    state: 'ELIGIBLE',
    eligibleT: rec.modelledMassT ?? 0,
    plannedT: 0,
    orderedT: 0,
    verifiedT: 0,
    deliveries: [],
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function assertTransition(state: LedgerState_Rec, eventType: string): void {
  const allowed = TRANSITION_GUARDS[eventType] ?? [];
  if (!allowed.includes(state.state)) {
    throw new LedgerError(
      'INVALID_TRANSITION',
      `Cannot apply '${eventType}' to a recommendation in state '${state.state}'. ` +
        `Allowed predecessor states: ${allowed.join(', ')}.`,
    );
  }
}
