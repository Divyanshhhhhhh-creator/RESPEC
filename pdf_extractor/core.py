import re
from io import BytesIO

from pypdf import PdfReader


UNIT_ALIASES = {
    "m": "m",
    "m1": "m",
    "rm": "m",
    "rmt": "m",
    "m2": "m2",
    "m²": "m2",
    "sqm": "m2",
    "sq.m": "m2",
    "sqmt": "m2",
    "m3": "m3",
    "m³": "m3",
    "cum": "m3",
    "cu.m": "m3",
    "no": "no",
    "nos": "no",
    "nr": "no",
    "each": "no",
    "ea": "no",
    "kg": "kg",
    "kgs": "kg",
    "g": "g",
    "t": "tonne",
    "ton": "tonne",
    "tons": "tonne",
    "tonne": "tonne",
    "tonnes": "tonne",
    "l": "l",
    "ltr": "l",
    "litre": "l",
    "litres": "l",
    "ls": "ls",
    "lot": "lot",
    "day": "day",
    "days": "day",
    "hr": "hr",
    "hrs": "hr",
}

ITEM_NUMBER = re.compile(r"^[A-Za-z]?\d+(?:[.\-/]\d+)*[A-Za-z]?$", re.IGNORECASE)
NUMBER = re.compile(r"^[-+]?\d[\d,]*(?:\.\d+)?$")
MAX_ROWS = 200


def _clean_token(token):
    return str(token).strip().strip("|:;()[]{}").lower()


def _number(token):
    value = str(token).replace(",", "").strip()
    if not NUMBER.fullmatch(value):
        return None
    parsed = float(value)
    return int(parsed) if parsed.is_integer() else parsed


def rows_from_text(text):
    rows = []
    for raw_line in str(text or "").splitlines():
        tokens = raw_line.replace("\t", " ").split()
        if len(tokens) < 4 or not ITEM_NUMBER.fullmatch(tokens[0]):
            continue

        unit_index = None
        unit = None
        for index in range(len(tokens) - 2, 1, -1):
            candidate = _clean_token(tokens[index])
            if candidate in UNIT_ALIASES and _number(tokens[index + 1]) is not None:
                unit_index = index
                unit = UNIT_ALIASES[candidate]
                break

        if unit_index is None:
            continue

        description = " ".join(tokens[1:unit_index]).strip(" -|:")
        quantity = _number(tokens[unit_index + 1])
        if not description or quantity is None:
            continue

        row = {
            "itemNumber": tokens[0],
            "description": description,
            "unit": unit,
            "quantity": quantity,
            "confidence": 0.82,
        }
        if unit_index + 2 < len(tokens):
            rate = _number(tokens[unit_index + 2])
            if rate is not None:
                row["rate"] = rate
        rows.append(row)
        if len(rows) > MAX_ROWS:
            raise ValueError("PDF_TOO_MANY_ROWS_MAX_200")

    return rows


def extract_pdf_rows(pdf_bytes):
    if not bytes(pdf_bytes).startswith(b"%PDF-"):
        raise ValueError("INVALID_PDF_FILE")

    reader = PdfReader(BytesIO(pdf_bytes))
    page_text = []
    for page in reader.pages:
        text = page.extract_text(extraction_mode="layout") or page.extract_text() or ""
        page_text.append(text)

    text = "\n".join(page_text).strip()
    if not text:
        raise ValueError("PDF_HAS_NO_EMBEDDED_TEXT_USE_ROWS_OR_OCR")

    rows = rows_from_text(text)
    if not rows:
        raise ValueError("PDF_TABLE_NOT_RECOGNIZED_USE_ROWS")

    return {"rows": rows, "pageCount": len(reader.pages)}
