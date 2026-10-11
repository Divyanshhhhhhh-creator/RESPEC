import { updateJob } from "../lib/store.js";

export async function handler(event) {
  const reason = JSON.stringify(event.error ?? { Error: "PIPELINE_FAILED" }).slice(0, 2000);
  await updateJob(event.jobId, "ERROR", { errorReason: reason });
  console.error(JSON.stringify({ message: "pipeline_failed", jobId: event.jobId, reason }));
  return { jobId: event.jobId, status: "ERROR" };
}

