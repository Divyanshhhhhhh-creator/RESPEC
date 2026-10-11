import { GetDocumentAnalysisCommand, TextractClient } from "@aws-sdk/client-textract";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { tablesToRows } from "../core/textract.js";

const textract = new TextractClient({});
const s3 = new S3Client({});

export async function handler(event) {
  const blocks = [];
  let nextToken;
  do {
    const page = await textract.send(new GetDocumentAnalysisCommand({ JobId: event.textractJobId, NextToken: nextToken, MaxResults: 1000 }));
    blocks.push(...(page.Blocks ?? []));
    nextToken = page.NextToken;
  } while (nextToken);

  const cacheKey = `textract/${event.cacheKey}.json`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: cacheKey,
    ContentType: "application/json",
    Body: JSON.stringify({ JobStatus: "SUCCEEDED", Blocks: blocks })
  }));
  const rows = tablesToRows(blocks);
  console.log(JSON.stringify({ message: "textract_collected", jobId: event.jobId, blockCount: blocks.length, rowCount: rows.length, cacheKey }));
  return { jobId: event.jobId, rows, textractCacheKey: cacheKey };
}

