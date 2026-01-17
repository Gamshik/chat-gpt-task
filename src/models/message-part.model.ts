export interface IMessagePartModel {
  id: string;
  message_id: string;
  state: string;
  type: string;
  text: string;
  toolCallId: string;
  input: string;
  output: string;
}

export interface ICreateMessagePartDTO {
  type: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  input?: string;
  output?: string;
}
