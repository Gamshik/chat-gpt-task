import { IPartApprovalModel } from "./part-approval.model";

export interface IMessagePartModel {
  id: string;
  messageId: string;
  type: string;
  state: string | null;
  text: string | null;
  toolCallId: string | null;
  input: string | null;
  output: string | null;
  approval?: IPartApprovalModel;
}
