interface IParseTableRangeResult {
  sheet: string;
  from: string;
  to: string;
}

export const parseTableRange = (
  range: string
): IParseTableRangeResult | null => {
  let sheet: string;
  let from: string;
  let to: string;

  const mentionMatch = range.match(/^@(\w+)!([A-Z]+\d+):([A-Z]+\d+)$/);

  if (mentionMatch) {
    // если формат меншона
    sheet = mentionMatch[1];
    from = mentionMatch[2];
    to = mentionMatch[3];
  } else {
    // обычный формат: "sheet=Users, from=A1, to=B4"
    const parts = range.split(",").map((p) => p.trim());
    const sheetPart = parts.find((p) => p.startsWith("sheet="));
    const fromPart = parts.find((p) => p.startsWith("from="));
    const toPart = parts.find((p) => p.startsWith("to="));

    if (!sheetPart || !fromPart || !toPart) return null;

    sheet = sheetPart.split("=")[1];
    from = fromPart.split("=")[1];
    to = toPart.split("=")[1];
  }

  return {
    sheet,
    from,
    to,
  };
};
