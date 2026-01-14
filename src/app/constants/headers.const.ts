export const Headers = {
  threadId: "x-thread-id",
} as const;

export type HeadersType = (typeof Headers)[keyof typeof Headers];
