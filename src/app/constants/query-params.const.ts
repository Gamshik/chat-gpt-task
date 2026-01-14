export const QueryParams = {
  threadId: "threadId",
} as const;

export type QueryParamsType = (typeof QueryParams)[keyof typeof QueryParams];
