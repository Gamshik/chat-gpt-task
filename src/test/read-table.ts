import * as XLSX from "xlsx";
import path from "path";
import { parseTableRange, parseTableTargetCell } from "@app/ai-tools/utils";
import { USERS_TABLE_PATH } from "@app/constants";

// const range = "@Users!A2:C5";
// const range = "sheet=Users, from=A2, to=C5";

// const rangeInfo = parseTableRange(range);

// if (!rangeInfo) throw new Error("Invalid range format");

// const { sheet: sheetName, from, to } = rangeInfo;

// const workbook = XLSX.readFile(path.join(process.cwd(), USERS_TABLE_PATH));
// const workbookSheet = workbook.Sheets[sheetName];
// if (!workbookSheet) throw new Error(`Sheet ${sheetName} not found`);

// const decodedRange = XLSX.utils.decode_range(`${from}:${to}`);
// const result: string[][] = [];

// for (let R = decodedRange.s.r; R <= decodedRange.e.r; ++R) {
//   const row: string[] = [];
//   for (let C = decodedRange.s.c; C <= decodedRange.e.c; ++C) {
//     const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
//     row.push(workbookSheet[cellAddress]?.v ?? "");
//   }
//   result.push(row);
// }

// console.log(result); // массив массивов, каждая внутренняя — строка
/////////////////////

const target = "sheet=Users, cell=G2";
// const target = "@Users!A1";

///////////////////////

// const value = "Glebushka";

// const targetInfo = parseTableTargetCell(target);

// if (!targetInfo) throw new Error("Invalid range format");

// const { sheet, cell } = targetInfo;

// const filePath = path.join(process.cwd(), USERS_TABLE_PATH);

// const workbook = XLSX.readFile(filePath);
// const workbookSheet = workbook.Sheets[sheet];

// if (!workbookSheet) throw new Error(`Sheet ${sheet} not found`);

// workbookSheet[cell] = { v: value, t: "s" };
// XLSX.writeFile(workbook, filePath);

///////////////

const targetInfo = parseTableTargetCell(target);

if (!targetInfo) throw new Error("Invalid range format");

const { sheet, cell } = targetInfo;

const filePath = path.join(process.cwd(), USERS_TABLE_PATH);

const workbook = XLSX.readFile(filePath);
const workbookSheet = workbook.Sheets[sheet];

if (!workbookSheet) throw new Error(`Sheet ${sheet} not found`);

const cellObj = workbookSheet[cell];

console.log(cellObj);
