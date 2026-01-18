export interface ICreateMessagePartDTO {
  type: string;
  text?: string;
  state?: string;
  toolCallId?: string;
  input?: string;
  output?: string;
}
