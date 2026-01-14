export const HighlightSections = {
  sidebar: "sidebar",
  chat: "chat",
  input: "input",
} as const;

export type HighlightSectionType =
  (typeof HighlightSections)[keyof typeof HighlightSections];
