export type MessageWithPartRow = {
  id: string;
  threadId: string;
  role: string;
  createdAt: string;

  partId: string | null;
  type: string | null;
  state: string | null;
  text: string | null;
  toolCallId: string | null;
  input: string | null;
  output: string | null;

  approvalRowId: string | null;
  approvalId: string | null;
  isApproved: number | null; // 0 | 1
};
