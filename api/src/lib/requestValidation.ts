import {
  CreateJobRequestSchema,
  DecisionRequestSchema,
  DeliveryRequestSchema,
  EvidenceUrlRequestSchema,
  OrderRequestSchema,
  PatchLinesRequestSchema,
  StartJobRequestSchema,
  type CreateJobRequest,
  type DecisionRequest,
  type DeliveryRequest,
  type EvidenceUrlRequest,
  type OrderRequest,
  type PatchLinesRequest,
  type StartJobRequest,
} from '@respec/contracts';

export const requestSchemas = {
  createJob: CreateJobRequestSchema,
  startJob: StartJobRequestSchema,
  patchLines: PatchLinesRequestSchema,
  decision: DecisionRequestSchema,
  order: OrderRequestSchema,
  evidenceUrl: EvidenceUrlRequestSchema,
  delivery: DeliveryRequestSchema,
} as const;

export type {
  CreateJobRequest,
  DecisionRequest,
  DeliveryRequest,
  EvidenceUrlRequest,
  OrderRequest,
  PatchLinesRequest,
  StartJobRequest,
};
