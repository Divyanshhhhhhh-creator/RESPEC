import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
const tableName = process.env.TABLE_NAME;

export function jobKey(jobId) {
  return { PK: `JOB#${jobId}`, SK: "META" };
}

export async function putJob(job) {
  await client.send(new PutCommand({
    TableName: tableName,
    Item: { ...jobKey(job.jobId), entityType: "JOB", ...job },
    ConditionExpression: "attribute_not_exists(PK)"
  }));
}

export async function getJob(jobId) {
  const result = await client.send(new GetCommand({ TableName: tableName, Key: jobKey(jobId) }));
  return result.Item ?? null;
}

export async function listLines(jobId) {
  const result = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: { ":pk": `JOB#${jobId}`, ":prefix": "LINE#" }
  }));
  return (result.Items ?? []).map(({ PK, SK, entityType, ...line }) => line);
}

export async function putLines(jobId, lines) {
  for (let offset = 0; offset < lines.length; offset += 25) {
    const chunk = lines.slice(offset, offset + 25);
    await client.send(new BatchWriteCommand({
      RequestItems: {
        [tableName]: chunk.map((line) => ({
          PutRequest: {
            Item: {
              PK: `JOB#${jobId}`,
              SK: `LINE#${String(line.lineId).padStart(6, "0")}`,
              entityType: "LINE",
              ...line
            }
          }
        }))
      }
    }));
  }
}

export async function updateJob(jobId, status, extra = {}) {
  const fields = { status, updatedAt: new Date().toISOString(), ...extra };
  const names = {};
  const values = {};
  const setters = Object.keys(fields).map((key, index) => {
    names[`#f${index}`] = key;
    values[`:v${index}`] = fields[key];
    return `#f${index} = :v${index}`;
  });
  await client.send(new UpdateCommand({
    TableName: tableName,
    Key: jobKey(jobId),
    UpdateExpression: `SET ${setters.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: "attribute_exists(PK)"
  }));
}

