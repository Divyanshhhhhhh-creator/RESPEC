import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { getJob, updateJob } from "../lib/store.js";
import { isAuthorized, json } from "../lib/http.js";

const sfn = new SFNClient({});

export async function handler(event) {
  if (!isAuthorized(event)) return json(401, { error: "UNAUTHORIZED" });
  const jobId = event.pathParameters?.id;
  const job = await getJob(jobId);
  if (!job) return json(404, { error: "JOB_NOT_FOUND" });

  const input = job.source === "PDF"
    ? {
        jobId,
        source: "PDF",
        extractionMode: process.env.PDF_EXTRACTION_MODE ?? "LOCAL",
        s3: { bucket: process.env.BUCKET_NAME, key: job.sourceKey },
        cacheKey: jobId
      }
    : { jobId, source: "ROWS", rows: job.rows ?? [] };

  await updateJob(jobId, "PROCESSING");
  let execution;
  try {
    execution = await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      name: `job-${jobId}`.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80),
      input: JSON.stringify(input)
    }));
  } catch (error) {
    await updateJob(jobId, "ERROR", { errorReason: `START_EXECUTION_FAILED:${error.name}` });
    throw error;
  }
  console.log(JSON.stringify({ message: "pipeline_started", jobId, executionArn: execution.executionArn }));
  return json(202, { jobId, status: "PROCESSING", executionArn: execution.executionArn });
}

