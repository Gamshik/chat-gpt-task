import { MessagePartStateType } from "@app/types";

export interface ISimpleMessagePart {
  type: MessagePartStateType;
  state?: string;
}
