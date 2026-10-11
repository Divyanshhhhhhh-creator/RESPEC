# ReSpec backend API — foundation contract

All requests include `x-demo-passcode`. This is a temporary hackathon control,
not production authentication.

## Create a rows job

`POST /jobs`

```json
{
  "source": "ROWS",
  "rows": [
    { "itemNumber": "1", "description": "Paver blocks", "unit": "m2", "quantity": 100 }
  ]
}
```

Returns `201` with `jobId` and status `CREATED`.

## Create a PDF job

`POST /jobs`

```json
{ "source": "PDF", "fileName": "demo-boq.pdf" }
```

Returns a five-minute `uploadUrl`. Upload the PDF with content type
`application/pdf` before starting the pipeline. The default `LOCAL` extraction
mode supports PDFs that contain selectable text and does not require Textract.
Scanned/image-only PDFs require OCR; use the `ROWS` workflow instead unless the
stack is deliberately deployed with `PdfExtractionMode=TEXTRACT` on an eligible
AWS account.

## Start processing

`POST /jobs/{id}/start`

Returns `202` with the Step Functions execution ARN.

## Read job and extracted lines

`GET /jobs/{id}`

The demo-ready terminal extraction state is `NEEDS_REVIEW`.

## Save corrected lines

`PATCH /jobs/{id}/lines`

```json
{ "lines": [{ "lineId": "1", "description": "Paver blocks", "unit": "m2", "quantity": 100 }] }
```

Evaluation, approval, gap, plan, order and delivery endpoints remain contract
stubs until the team freezes the domain and ledger function signatures.

