import { ICreateMessagePartDTO } from "@dto";
import { MessageRoleType } from "@models";

export interface ICreateMessageDTO {
  threadId: string;
  role: MessageRoleType;
  parts?: ICreateMessagePartDTO[];
}
