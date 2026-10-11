import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRows } from "../src/core/normalize.js";
import { classifyLine, classifyLines } from "../src/core/classify.js";
import { tablesToRows } from "../src/core/textract.js";

test("normalizes common BOQ column names", () => {
  const [line] = normalizeRows([{ "Item No.": "1", Particulars: "Paver blocks", UOM: "Sqm", Qty: "1,250", Rate: "42.5" }]);
  assert.equal(line.itemNumber, "1");
  assert.equal(line.description, "Paver blocks");
  assert.equal(line.unit, "sqm");
  assert.equal(line.quantity, 1250);
  assert.equal(line.rate, 42.5);
});

test("unknown descriptions default to manual review", () => {
  const result = classifyLine({ description: "Special proprietary work", unit: "nos", quantity: 1 });
  assert.equal(result.category, "MANUAL_REVIEW");
  assert.equal(result.reviewStatus, "MANUAL_REVIEW");
});

test("safety critical concrete remains manual review", () => {
  const [result] = classifyLines([{ description: "M35 RCC retaining wall", unit: "m3", quantity: 10 }]);
  assert.equal(result.category, "REINFORCED_CONCRETE");
  assert.equal(result.reviewStatus, "MANUAL_REVIEW");
  assert.ok(result.classificationReasons.includes("SAFETY_CRITICAL_DESCRIPTION"));
});

test("turns a simple Textract cell matrix into objects", () => {
  const blocks = [
    { Id: "c11", BlockType: "CELL", RowIndex: 1, ColumnIndex: 1, Relationships: [{ Type: "CHILD", Ids: ["w11"] }] },
    { Id: "w11", BlockType: "WORD", Text: "Description" },
    { Id: "c12", BlockType: "CELL", RowIndex: 1, ColumnIndex: 2, Relationships: [{ Type: "CHILD", Ids: ["w12"] }] },
    { Id: "w12", BlockType: "WORD", Text: "Qty" },
    { Id: "c21", BlockType: "CELL", RowIndex: 2, ColumnIndex: 1, Relationships: [{ Type: "CHILD", Ids: ["w21"] }] },
    { Id: "w21", BlockType: "WORD", Text: "Pavers" },
    { Id: "c22", BlockType: "CELL", RowIndex: 2, ColumnIndex: 2, Relationships: [{ Type: "CHILD", Ids: ["w22"] }] },
    { Id: "w22", BlockType: "WORD", Text: "10" }
  ];
  assert.deepEqual(tablesToRows(blocks), [{ Description: "Pavers", Qty: "10" }]);
});

