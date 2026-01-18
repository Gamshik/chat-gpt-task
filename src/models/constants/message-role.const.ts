export const MessageRole = {
  User: "user",
  Assistant: "assistant",
  Tool: "tool",
} as const;

export type MessageRoleType = (typeof MessageRole)[keyof typeof MessageRole];
