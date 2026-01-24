import { MessagePartStateType } from "@app/types";
import { IApprovalData } from "./approval-data.interface";

export interface IToolPart {
  state: MessagePartStateType;
  toolCallId: string;
  type: string;
  input: unknown;
  output: unknown;
  errorText?: string;
  approval?: IApprovalData;
  providerExecuted?: boolean;
  title?: string;
}
