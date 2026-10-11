import {
  ProjectJob,
  LineItem,
  Recommendation,
  ComplianceGap,
  DeliveryRecord,
  ImpactSummary,
  PlanRow,
  NewProjectFormValues,
} from '../types';
import { loadSavedState, saveState, AppState } from './mockStorage';
import { normalizeLine } from '../core/normalize';
import { classifyLine } from '../core/classify';
import { evaluateLines } from '../core/evaluate';
import { computeGap } from '../core/gapCalculator';
import {
  computeImpactSummary,
  validateDeliveryRecord,
  canApproveRecommendation,
} from '../core/ledgerReducer';

// Check mock mode flag: defaults to true until live API is configured
export const isMockMode = (): boolean => {
  const envMode = import.meta.env.VITE_MOCK;
  if (envMode === '0' || envMode === 'false') return false;
  return true;
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.respec.internal/v1';

class ApiClient {
  private getState(): AppState {
    return loadSavedState();
  }

  private updateState(updater: (state: AppState) => void): AppState {
    const state = this.getState();
    updater(state);
    saveState(state);
    return state;
  }

  // POST /jobs
  async createJob(data: NewProjectFormValues): Promise<{ jobId: string; uploadUrl: string; key: string }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
      return res.json();
    }

    // Mock Mode
    const jobId = `job-${Date.now().toString(36)}`;
    const newJob: ProjectJob = {
      jobId,
      projectName: data.projectName,
      projectType: data.projectType,
      builtUpAreaM2: data.builtUpAreaM2,
      fy: data.fy,
      site: {
        lat: data.lat,
        lng: data.lng,
        address: data.address,
      },
      status: 'UPLOADED',
      stage: 'Job Created — Ready for BOQ Upload',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linesCount: 0,
    };

    this.updateState((s) => {
      s.currentJob = newJob;
      s.lines = [];
      s.recommendations = [];
      s.gap = null;
      s.deliveries = [];
      s.planRows = [];
    });

    return {
      jobId,
      uploadUrl: `https://mock-s3.respec.internal/boq/${jobId}.pdf`,
      key: `boq/${jobId}.pdf`,
    };
  }

  // POST /jobs/{id}/start
  async startJobExtraction(
    jobId: string,
    source: 'pdf' | 'rows',
    rawRows?: Array<{ itemNo?: string; description: string; unit: string; qty: number; rate?: number; confidence?: number }>
  ): Promise<{ status: 'QUEUED' }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, rows: rawRows }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    // In mock mode, process the rows immediately or simulate pipeline
    this.updateState((s) => {
      s.currentJob.status = 'EXTRACTING';
      s.currentJob.stage = source === 'pdf' ? 'AWS Textract Table Extraction' : 'Parsing Rows';

      if (rawRows && rawRows.length > 0) {
        const normalized: LineItem[] = rawRows.map((r, i) => {
          const line = normalizeLine(r, i);
          const cls = classifyLine(line.description, line.gradeParsed);
          line.category = cls.category;
          line.categoryConfidence = cls.confidence;
          return line;
        });

        s.lines = normalized;
        s.currentJob.linesCount = normalized.length;
        s.currentJob.status = 'NEEDS_REVIEW';
        s.currentJob.stage = 'Table Extracted — Awaiting Engineering Review & Confirmation';
      }
    });

    return { status: 'QUEUED' };
  }

  // GET /jobs/{id}
  async getJob(jobId: string): Promise<{
    status: ProjectJob['status'];
    stage: string;
    error?: string;
    lines: LineItem[];
    job: ProjectJob;
  }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    const state = this.getState();
    return {
      status: state.currentJob.status,
      stage: state.currentJob.stage,
      lines: state.lines,
      job: state.currentJob,
    };
  }

  // PATCH /jobs/{id}/lines
  async patchLines(
    jobId: string,
    edits: Array<{ lineId: string; field: keyof LineItem; value: any }>
  ): Promise<{ lines: LineItem[] }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/lines`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edits }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    let updatedLines: LineItem[] = [];
    this.updateState((s) => {
      // D8: Editing lines after evaluate resets status to NEEDS_REVIEW and discards recs/decisions
      edits.forEach((edit) => {
        const target = s.lines.find((l) => l.lineId === edit.lineId);
        if (target) {
          (target as any)[edit.field] = edit.value;

          // Re-normalize line to update mass, flags, grade
          const reNormalized = normalizeLine(target, 0);
          Object.assign(target, reNormalized);

          const cls = classifyLine(target.description, target.gradeParsed);
          target.category = cls.category;
          target.categoryConfidence = cls.confidence;
        }
      });
      s.currentJob.status = 'NEEDS_REVIEW';
      s.currentJob.stage = 'Edits Applied — Review and Confirm Required';
      updatedLines = s.lines;
    });

    return { lines: updatedLines };
  }

  // POST /jobs/{id}/confirm
  async confirmJob(jobId: string): Promise<{ status: 'READY' }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/confirm`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    this.updateState((s) => {
      s.currentJob.status = 'READY';
      s.currentJob.stage = 'Table Confirmed by Engineer — Ready for Evaluation';
    });

    return { status: 'READY' };
  }

  // POST /jobs/{id}/evaluate
  async evaluateJob(jobId: string): Promise<{ recommendations: Recommendation[]; gap: ComplianceGap }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/evaluate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    const state = this.getState();
    const recs = evaluateLines(state.lines, state.currentJob.site);
    const gap = computeGap(state.lines, recs, state.currentJob);

    this.updateState((s) => {
      s.recommendations = recs;
      s.gap = gap;
      s.impact = computeImpactSummary(recs, s.deliveries);
    });

    return { recommendations: recs, gap };
  }

  // POST /jobs/{id}/decisions
  async recordDecision(
    jobId: string,
    data: {
      recId: string;
      decision: 'APPROVE' | 'REJECT';
      approver: string;
      note?: string;
      acknowledgedConditions?: string[];
    }
  ): Promise<{ rec: Recommendation }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    let modifiedRec: Recommendation | undefined;

    this.updateState((s) => {
      const rec = s.recommendations.find((r) => r.recId === data.recId);
      if (!rec) throw new Error(`Recommendation not found: ${data.recId}`);

      if (data.decision === 'APPROVE') {
        const check = canApproveRecommendation(rec);
        if (!check.allowed) {
          throw new Error(check.reason);
        }
      }

      rec.decision = data.decision;
      rec.approver = data.approver;
      rec.approvalTimestamp = new Date().toISOString();
      rec.approvalNote = data.note;
      rec.acknowledgedConditions = data.acknowledgedConditions || [];

      // Recompute gap and impact
      s.gap = computeGap(s.lines, s.recommendations, s.currentJob);
      s.impact = computeImpactSummary(s.recommendations, s.deliveries);
      modifiedRec = rec;
    });

    return { rec: modifiedRec! };
  }

  // POST /jobs/{id}/plan
  async generatePlan(jobId: string): Promise<{ planId: string; rows: PlanRow[]; exportUrls: { csv: string; pdf: string } }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/plan`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    let generatedRows: PlanRow[] = [];
    const planId = `plan-${Date.now().toString(36)}`;

    this.updateState((s) => {
      // D5: POST /plan sets approved recs to PLANNED, so planned tonnes exist only after a plan is generated
      s.recommendations.forEach((r) => {
        if (r.decision === 'APPROVE' && r.ledgerState === 'ELIGIBLE') {
          r.ledgerState = 'PLANNED';
        }
      });

      generatedRows = s.recommendations
        .filter((r) => r.decision === 'APPROVE')
        .map((r) => {
          const line = s.lines.find((l) => l.lineId === r.lineId)!;
          return {
            recId: r.recId,
            itemNo: line?.itemNo || '-',
            description: line?.description || '-',
            originalQty: line?.qty || 0,
            unit: line?.unit || 't',
            allowedProduct: r.product,
            maxSharePct: r.maxShare,
            plannedRecycledT: r.modelledMassT || 0,
            recommendedFacility: r.facilityOptions[0]?.facilityName || 'Authorized Plant',
            distanceKm: r.facilityOptions[0]?.distanceKm || 0,
            sourceClause: r.source.clause,
            status: r.status,
            decision: r.decision || 'APPROVE',
            approver: r.approver || 'Er. Aarvi Bansal',
            poRef: r.poRef,
            ledgerState: r.ledgerState,
          };
        });

      s.planRows = generatedRows;
      s.impact = computeImpactSummary(s.recommendations, s.deliveries);
    });

    return {
      planId,
      rows: generatedRows,
      exportUrls: {
        csv: `#export-csv-${planId}`,
        pdf: `#export-pdf-${planId}`,
      },
    };
  }

  // POST /jobs/{id}/orders
  async setOrder(
    jobId: string,
    data: { recId: string; poRef: string }
  ): Promise<{ rec: Recommendation }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    let modifiedRec: Recommendation | undefined;

    this.updateState((s) => {
      const rec = s.recommendations.find((r) => r.recId === data.recId);
      if (!rec) throw new Error(`Recommendation not found: ${data.recId}`);
      if (rec.decision !== 'APPROVE') {
        throw new Error('Cannot place order for an unapproved recommendation');
      }

      rec.poRef = data.poRef;
      rec.orderedAt = new Date().toISOString();
      if (rec.ledgerState === 'ELIGIBLE' || rec.ledgerState === 'PLANNED') {
        rec.ledgerState = 'ORDERED';
      }

      // Update plan row if exists
      const planRow = s.planRows.find((p) => p.recId === data.recId);
      if (planRow) {
        planRow.poRef = data.poRef;
        planRow.ledgerState = rec.ledgerState;
      }

      s.impact = computeImpactSummary(s.recommendations, s.deliveries);
      modifiedRec = rec;
    });

    return { rec: modifiedRec! };
  }

  // POST /jobs/{id}/deliveries
  async recordDelivery(
    jobId: string,
    data: {
      recId: string;
      facilityId: string;
      quantityT: number;
      slipNo: string;
      date: string;
      evidenceKey?: string;
      evidenceFilename?: string;
    }
  ): Promise<{ deliveryId: string; state: 'VERIFIED' | 'FLAGGED'; flags: string[] }> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    const state = this.getState();
    const rec = state.recommendations.find((r) => r.recId === data.recId);
    if (!rec) throw new Error(`Recommendation not found: ${data.recId}`);

    const facility = rec.facilityOptions.find((f) => f.facilityId === data.facilityId) || rec.facilityOptions[0];
    const validation = validateDeliveryRecord(rec, state.deliveries, {
      quantityT: data.quantityT,
      slipNo: data.slipNo,
      evidenceKey: data.evidenceKey,
    });

    const deliveryId = `deliv-${Date.now().toString(36)}`;
    const line = state.lines.find((l) => l.lineId === rec.lineId);

    const deliveryRecord: DeliveryRecord = {
      deliveryId,
      recId: data.recId,
      itemNo: line?.itemNo || '-',
      description: line?.description || rec.product,
      facilityId: data.facilityId,
      facilityName: facility?.facilityName || 'Authorized Facility',
      quantityT: data.quantityT,
      slipNo: data.slipNo,
      date: data.date,
      evidenceKey: data.evidenceKey,
      evidenceFilename: data.evidenceFilename,
      evidenceUrl: data.evidenceKey ? `#evidence-${data.evidenceKey}` : undefined,
      state: validation.state,
      flags: validation.flags,
      createdAt: new Date().toISOString(),
    };

    this.updateState((s) => {
      s.deliveries.unshift(deliveryRecord);
      if (validation.state === 'VERIFIED') {
        const targetRec = s.recommendations.find((r) => r.recId === data.recId);
        if (targetRec) {
          targetRec.ledgerState = 'VERIFIED';
          targetRec.verifiedT = (targetRec.verifiedT || 0) + data.quantityT;
        }
      }
      s.impact = computeImpactSummary(s.recommendations, s.deliveries);
    });

    return {
      deliveryId,
      state: validation.state,
      flags: validation.flags,
    };
  }

  // GET /jobs/{id}/impact
  async getImpact(jobId: string): Promise<ImpactSummary> {
    if (!isMockMode()) {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/impact`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    const state = this.getState();
    return state.impact;
  }
}

export const api = new ApiClient();
