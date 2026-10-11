import crypto from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getJob, listLines, putJob, putLines, updateJob } from "../lib/store.js";
import { isAuthorized, json, parseBody } from "../lib/http.js";

const s3 = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

function safeFileName(name) {
  return String(name ?? "boq.pdf").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function handler(event) {
  const route = event.routeKey;
  const requestId = event.requestContext?.requestId;
  console.log(JSON.stringify({ message: "api_request", route, requestId }));

  if (!isAuthorized(event)) return json(401, { error: "UNAUTHORIZED" });

  try {
    if (route === "POST /jobs") {
      const body = parseBody(event);
      const source = String(body.source ?? "").toUpperCase();
      if (!["ROWS", "PDF"].includes(source)) return json(400, { error: "SOURCE_MUST_BE_ROWS_OR_PDF" });
      if (source === "ROWS" && !Array.isArray(body.rows)) return json(400, { error: "ROWS_REQUIRED" });

      const jobId = crypto.randomUUID();
      const now = new Date().toISOString();
      const sourceKey = source === "PDF" ? `uploads/${jobId}/${safeFileName(body.fileName)}` : null;
      await putJob({ jobId, source, sourceKey, rows: source === "ROWS" ? body.rows : undefined, status: "CREATED", createdAt: now, updatedAt: now });

      let uploadUrl;
      if (source === "PDF") {
        uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucketName, Key: sourceKey, ContentType: "application/pdf" }), { expiresIn: 300 });
      }
      return json(201, { jobId, source, status: "CREATED", uploadUrl, sourceKey });
    }

    if (route === "GET /jobs/{id}") {
      const jobId = event.pathParameters?.id;
      const job = await getJob(jobId);
      if (!job) return json(404, { error: "JOB_NOT_FOUND" });
      return json(200, { job: { ...job, PK: undefined, SK: undefined }, lines: await listLines(jobId) });
    }

    if (route === "PATCH /jobs/{id}/lines") {
      const jobId = event.pathParameters?.id;
      const body = parseBody(event);
      if (!Array.isArray(body.lines)) return json(400, { error: "LINES_REQUIRED" });
      await putLines(jobId, body.lines);
      await updateJob(jobId, "NEEDS_REVIEW", { userEdited: true });
      return json(200, { jobId, status: "NEEDS_REVIEW", lines: body.lines });
    }

    return json(404, { error: "ROUTE_NOT_FOUND", route });
  } catch (error) {
    console.error(JSON.stringify({ message: "api_error", route, requestId, error: error.message }));
    return json(error.message === "INVALID_JSON" ? 400 : 500, { error: error.message === "INVALID_JSON" ? error.message : "INTERNAL_ERROR" });
  }
}

