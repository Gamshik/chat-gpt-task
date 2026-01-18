import { MessageRoleType } from "./constants";
import { IMessagePartModel } from "./message-part.model";

export interface IMessageModel {
  id: string;
  threadId: string;
  role: MessageRoleType;
  createdAt: string;
  parts: IMessagePartModel[];
}
