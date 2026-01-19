import { IMessageModel, MessageRole } from "@models";
import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";

export const messageModelToUi = (message: IMessageModel): UIMessage | null =>
  message.role === MessageRole.Tool
    ? null
    : {
        id: message.id.toString(),
        role: message.role,
        parts: message.parts
          .map(
            (p) =>
              ({
                type: p.type,
                state: p.state,
                text: p.text,
                output: p.output,
              }) as UIMessagePart<UIDataTypes, UITools>,
          )
          .sort((a, b) => {
            // сортируем так, чтобы тулы была вначале
            if (a.type.startsWith("tool-")) {
              return -1;
            } else if (b.type.startsWith("tool-")) {
              return 1;
            }
            return 0;
          }),
      };
