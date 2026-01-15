import { UIMessage } from "ai";

export interface ISendChatMessageParams {
  message: UIMessage;
  threadId: string | null;
}
