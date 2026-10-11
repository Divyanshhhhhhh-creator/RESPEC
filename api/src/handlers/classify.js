import { classifyLines } from "../core/classify.js";

export async function handler(event) {
  const lines = classifyLines(event.lines ?? []);
  console.log(JSON.stringify({ message: "classified", jobId: event.jobId, lineCount: lines.length }));
  return { jobId: event.jobId, lines };
}

