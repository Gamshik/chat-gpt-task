import { ICellRangeData } from "./cell-range-data.interface";

export interface IGetExcelRangeMentionParams {
  rangeData: ICellRangeData;
  sheet: string;
}
