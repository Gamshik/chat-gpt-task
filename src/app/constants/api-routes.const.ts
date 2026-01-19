export const ApiRoutes = {
  getAllThreads: "/api/threads",
  getAllThreadMessages: (threadId: string) =>
    `/api/threads/${threadId}/messages`,
  createMessage: (threadId: string) => `/api/threads/${threadId}/messages`,
} as const;
