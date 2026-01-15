import { IMessageModel, MessageRole } from "@models";
import { UIMessage } from "ai";

export const messageModelToUi = (merssage: IMessageModel): UIMessage | null =>
  merssage.role === MessageRole.Tool
    ? null
    : {
        id: merssage.id.toString(),
        role: merssage.role,
        parts: [{ type: "text", text: merssage.content }],
      };
