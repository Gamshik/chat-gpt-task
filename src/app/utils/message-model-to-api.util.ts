import { IMessageModel, MessageRole } from "@models";
import { UIMessage } from "ai";

export const messageModelToApi = (message: IMessageModel): UIMessage | null =>
  message.role === MessageRole.Tool
    ? null
    : {
        id: message.id.toString(),
        role: message.role,
        parts: message.parts
          .filter((p) => p.type === "text")
          .map((p) => ({
            type: "text",
            text: p.text,
          })),
      };
