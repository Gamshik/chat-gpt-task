import { MessageRoleType } from "./constants";

export interface IMessageModel {
  id: string;
  thread_id: string;
  role: MessageRoleType;
  content: string;
  created_at: string;
}

export interface ICreateMessageDTO {
  thread_id: string;
  role: MessageRoleType;
  content: string;
}
