const FIELD_ALIASES = {
  itemNumber: ["itemnumber", "itemno", "item", "serial", "sno"],
  description: ["description", "itemdescription", "particulars", "workdescription"],
  unit: ["unit", "uom"],
  quantity: ["quantity", "qty"],
  rate: ["rate", "unitrate"]
};

function compactKey(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(row, target) {
  const aliases = FIELD_ALIASES[target];
  for (const [key, value] of Object.entries(row ?? {})) {
    if (aliases.includes(compactKey(key))) return value;
  }
  return undefined;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeRows(rows = []) {
  return rows
    .map((row, index) => {
      const description = String(pick(row, "description") ?? "").trim();
      const unit = String(pick(row, "unit") ?? "").trim().toLowerCase();
      const quantity = numberOrNull(pick(row, "quantity"));
      const warnings = [];
      if (!description) warnings.push("MISSING_DESCRIPTION");
      if (!unit) warnings.push("UNKNOWN_UNIT");
      if (quantity === null) warnings.push("INVALID_QUANTITY");

      return {
        lineId: String(row.lineId ?? index + 1),
        itemNumber: String(pick(row, "itemNumber") ?? index + 1),
        description,
        unit,
        quantity,
        rate: numberOrNull(pick(row, "rate")),
        confidence: Number(row.confidence ?? (warnings.length ? 0.55 : 0.9)),
        warnings
      };
    })
    .filter((line) => line.description || line.quantity !== null);
}

