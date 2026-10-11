import { putLines, updateJob } from "../lib/store.js";

export async function handler(event) {
  await putLines(event.jobId, event.lines ?? []);
  await updateJob(event.jobId, "NEEDS_REVIEW", { lineCount: event.lines?.length ?? 0 });
  console.log(JSON.stringify({ message: "persisted", jobId: event.jobId, lineCount: event.lines?.length ?? 0 }));
  return { jobId: event.jobId, status: "NEEDS_REVIEW", lineCount: event.lines?.length ?? 0 };
}

