import { MessageRoleType } from "./constants";
import { ICreateMessagePartDTO, IMessagePartModel } from "./message-part.model";

export interface IMessageModel {
  id: string;
  thread_id: string;
  role: MessageRoleType;
  created_at: string;
  parts: IMessagePartModel[];
}

export interface ICreateMessageDTO {
  thread_id: string;
  role: MessageRoleType;
  parts?: ICreateMessagePartDTO[];
}
