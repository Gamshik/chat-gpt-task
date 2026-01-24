export interface ITableModalProps {
  sheet: string;
  rows: string[][];
  onClose: () => void;
  onMention: (mention: string) => void;
}
