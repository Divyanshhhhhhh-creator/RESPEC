import { normalizeRows } from "../core/normalize.js";

export async function handler(event) {
  const lines = normalizeRows(event.rows ?? []);
  console.log(JSON.stringify({ message: "normalized", jobId: event.jobId, lineCount: lines.length }));
  return { jobId: event.jobId, lines };
}

