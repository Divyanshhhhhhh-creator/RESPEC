function childText(block, blockById) {
  const ids = (block.Relationships ?? [])
    .filter((relationship) => relationship.Type === "CHILD")
    .flatMap((relationship) => relationship.Ids ?? []);

  return ids
    .map((id) => blockById.get(id))
    .filter((child) => child?.BlockType === "WORD" || child?.BlockType === "SELECTION_ELEMENT")
    .map((child) => child.BlockType === "SELECTION_ELEMENT" ? child.SelectionStatus : child.Text)
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function tablesToRows(blocks = []) {
  const blockById = new Map(blocks.map((block) => [block.Id, block]));
  const cells = blocks.filter((block) => block.BlockType === "CELL");
  if (!cells.length) return [];

  const matrix = new Map();
  for (const cell of cells) {
    const rowIndex = Number(cell.RowIndex ?? 0);
    const columnIndex = Number(cell.ColumnIndex ?? 0);
    if (!rowIndex || !columnIndex) continue;
    if (!matrix.has(rowIndex)) matrix.set(rowIndex, new Map());
    matrix.get(rowIndex).set(columnIndex, childText(cell, blockById));
  }

  const ordered = [...matrix.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, columns]) => [...columns.entries()].sort(([a], [b]) => a - b).map(([, value]) => value));

  if (ordered.length < 2) return [];
  const headers = ordered[0].map((header, index) => header || `column_${index + 1}`);
  return ordered.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

