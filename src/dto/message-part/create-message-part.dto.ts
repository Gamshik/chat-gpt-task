import { ICreatePartAprovalDTO } from "@dto";

export interface ICreateMessagePartDTO {
  type: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  approval?: ICreatePartAprovalDTO;
  input?: string;
  output?: string;
}
