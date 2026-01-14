interface IParseTableTargetCellResult {
  sheet: string;
  cell: string;
}

export const parseTableTargetCell = (
  target: string
): IParseTableTargetCellResult | null => {
  let sheet: string;
  let cell: string;

  const mentionMatch = target.match(/^@(\w+)!([A-Z]+\d+)$/);

  if (mentionMatch) {
    // если формат меншона
    sheet = mentionMatch[1];
    cell = mentionMatch[2];
  } else {
    // обычный формат: "sheet=Users, cell=A1"
    const parts = target.split(",").map((p) => p.trim());
    const sheetPart = parts.find((p) => p.startsWith("sheet="));
    const cellPart = parts.find((p) => p.startsWith("cell="));

    if (!sheetPart || !cellPart) return null;

    sheet = sheetPart.split("=")[1];
    cell = cellPart.split("=")[1];
  }

  return {
    sheet,
    cell,
  };
};
