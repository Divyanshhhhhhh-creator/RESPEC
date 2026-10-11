import json
import os

import boto3

from core import extract_pdf_rows


s3 = boto3.client("s3")
MAX_PDF_BYTES = 10 * 1024 * 1024


def handler(event, _context):
    bucket = event["s3"]["bucket"]
    key = event["s3"]["key"]
    response = s3.get_object(Bucket=bucket, Key=key)
    content_length = int(response.get("ContentLength", 0))
    if content_length > MAX_PDF_BYTES:
        raise ValueError("PDF_TOO_LARGE_MAX_10_MB")

    pdf_bytes = response["Body"].read(MAX_PDF_BYTES + 1)
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise ValueError("PDF_TOO_LARGE_MAX_10_MB")

    extracted = extract_pdf_rows(pdf_bytes)
    cache_key = f"local-pdf/{event['cacheKey']}.json"
    cache_body = {
        "extractionMode": "LOCAL_TEXT",
        "pageCount": extracted["pageCount"],
        "rows": extracted["rows"],
    }
    s3.put_object(
        Bucket=os.environ["BUCKET_NAME"],
        Key=cache_key,
        ContentType="application/json",
        Body=json.dumps(cache_body).encode("utf-8"),
    )
    print(json.dumps({
        "message": "local_pdf_extracted",
        "jobId": event["jobId"],
        "pageCount": extracted["pageCount"],
        "rowCount": len(extracted["rows"]),
        "cacheKey": cache_key,
    }))
    return {
        "jobId": event["jobId"],
        "rows": extracted["rows"],
        "localExtractionCacheKey": cache_key,
    }
