import * as XLSX from "xlsx";
import path from "path";

const filePath = path.join(process.cwd(), "public/tables/users.xlsx");

const sheetData = [
  [
    "ID",
    "Имя",
    "Email",
    "Сумма",
    "Дата регистрации",
    "Баланс после бонуса",
    "Налог (10%)",
  ],
  [
    1,
    "Алексей",
    "alex@example.com",
    1200,
    "2025-01-01",
    { f: "D2*1.1" },
    { f: "D2*1.1*0.1" },
  ],
  [
    2,
    "Мария",
    "maria@example.com",
    950,
    "2025-01-02",
    { f: "D3*1.1" },
    { f: "D3*1.1*0.1" },
  ],
  [
    3,
    "Иван",
    "ivan@example.com",
    430,
    "2025-01-03",
    { f: "D4*1.1" },
    { f: "D4*1.1*0.1" },
  ],
  [
    4,
    "Ольга",
    "olga@example.com",
    1570,
    "2025-01-04",
    { f: "D5*1.1" },
    { f: "D5*1.1*0.1" },
  ],
  [
    5,
    "Сергей",
    "sergey@example.com",
    2200,
    "2025-01-05",
    { f: "D6*1.1" },
    { f: "D6*1.1*0.1" },
  ],
  [
    6,
    "Екатерина",
    "katya@example.com",
    780,
    "2025-01-06",
    { f: "D7*1.1" },
    { f: "D7*1.1*0.1" },
  ],
  [
    7,
    "Дмитрий",
    "dmitry@example.com",
    1330,
    "2025-01-07",
    { f: "D8*1.1" },
    { f: "D8*1.1*0.1" },
  ],
  [
    8,
    "Наталья",
    "natalya@example.com",
    1900,
    "2025-01-08",
    { f: "D9*1.1" },
    { f: "D9*1.1*0.1" },
  ],
  [
    9,
    "Андрей",
    "andrey@example.com",
    670,
    "2025-01-09",
    { f: "D10*1.1" },
    { f: "D10*1.1*0.1" },
  ],
  [
    10,
    "Людмила",
    "lyudmila@example.com",
    1200,
    "2025-01-10",
    { f: "D11*1.1" },
    { f: "D11*1.1*0.1" },
  ],
];

const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.aoa_to_sheet(sheetData);
XLSX.utils.book_append_sheet(workbook, sheet, "Users");

// Сохраняем
XLSX.writeFile(workbook, filePath);

console.log("Файл создан с рабочими формулами:", filePath);
