import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "api" / "pdf_extractor"))

from core import extract_pdf_rows, rows_from_text  # noqa: E402


class PdfExtractorTests(unittest.TestCase):
    def test_extracts_boq_rows_from_text(self):
        text = """Item No Description Unit Quantity
1 Recycled aggregate back fill m3 120
2 Paver blocks m2 240 42.5
"""
        self.assertEqual(
            rows_from_text(text),
            [
                {
                    "itemNumber": "1",
                    "description": "Recycled aggregate back fill",
                    "unit": "m3",
                    "quantity": 120,
                    "confidence": 0.82,
                },
                {
                    "itemNumber": "2",
                    "description": "Paver blocks",
                    "unit": "m2",
                    "quantity": 240,
                    "confidence": 0.82,
                    "rate": 42.5,
                },
            ],
        )

    def test_rejects_non_pdf_bytes(self):
        with self.assertRaisesRegex(ValueError, "INVALID_PDF_FILE"):
            extract_pdf_rows(b"not a pdf")

    def test_extracts_generated_sample_pdf(self):
        fixture = PROJECT_ROOT / "output" / "pdf" / "respec-sample-boq.pdf"
        if not fixture.exists():
            self.skipTest("generated PDF fixture is not present")
        result = extract_pdf_rows(fixture.read_bytes())
        self.assertEqual(result["pageCount"], 1)
        self.assertEqual(len(result["rows"]), 5)
        self.assertEqual(result["rows"][2]["description"], "Precast recycled concrete paver blocks")


if __name__ == "__main__":
    unittest.main()
