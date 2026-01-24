export interface ITablePreviewProps {
  sheet: string;
  range: string;
  rows: string[][];
  setMention: (mention: string) => void;
}
