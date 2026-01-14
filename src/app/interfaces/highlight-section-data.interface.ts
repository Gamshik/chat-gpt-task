export const HIGHLIGHT_SECTIONS = ["sidebar", "chat", "input"] as const;

export type HighlightSectionType = (typeof HIGHLIGHT_SECTIONS)[number];

export interface IHighlightSectionData {
  section: HighlightSectionType;
  color: string;
}
