export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

export function parseBody(event) {
  if (!event?.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function isAuthorized(event) {
  const expected = process.env.DEMO_PASSCODE;
  if (!expected) return true;
  const headers = event.headers ?? {};
  const supplied = headers["x-demo-passcode"] ?? headers["X-Demo-Passcode"];
  return supplied === expected;
}

