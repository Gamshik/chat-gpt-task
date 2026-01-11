export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface IMessageModel {
  id: string;
  thread_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface ICreateMessageDTO {
  thread_id: string;
  role: MessageRole;
  content: string;
}
