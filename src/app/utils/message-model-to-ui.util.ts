import { IMessageModel, MessageRole } from "@models";
import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";

export const messageModelToUi = (message: IMessageModel): UIMessage | null =>
  message.role === MessageRole.Tool
    ? null
    : {
        id: message.id.toString(),
        role: message.role,
        parts: message.parts
          .map((p) => {
            if (p.type.startsWith("tool-")) {
              if (p.approval) {
                if (p.approval.isApproved !== null) {
                  return {
                    type: p.type,
                    state: p.state,
                    approval: {
                      id: p.approval.approvalId,
                      approved: p.approval.isApproved,
                    },
                  } as UIMessagePart<UIDataTypes, UITools>;
                }
                return {
                  type: p.type,
                  state: p.state,
                  approval: {
                    id: p.approval.approvalId,
                  },
                } as UIMessagePart<UIDataTypes, UITools>;
              }
              return {
                type: p.type,
                state: p.state,
                input: p.input,
                output: p.output,
              } as UIMessagePart<UIDataTypes, UITools>;
            } else {
              return {
                type: p.type,
                text: p.text ?? "",
              } as UIMessagePart<UIDataTypes, UITools>;
            }
          })
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
