import { IMessageModel, MessageRole } from "@models";
import { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";

export const messageModelToApi = (message: IMessageModel): UIMessage | null =>
  message.role === MessageRole.Tool
    ? null
    : {
        id: message.id,
        role: message.role,
        parts: message.parts.map((p) => {
          if (p.type.startsWith("tool-")) {
            if (p.approval) {
              if (p.approval.isApproved !== null) {
                return {
                  type: p.type,
                  state: p.state,
                  input: JSON.parse(p.input ?? "{}"),
                  toolCallId: p.toolCallId,
                  approval: {
                    id: p.approval.approvalId,
                    approved: p.approval.isApproved,
                  },
                } as UIMessagePart<UIDataTypes, UITools>;
              }
              return {
                type: p.type,
                state: p.state,
                input: JSON.parse(p.input ?? "{}"),
                toolCallId: p.toolCallId,
                approval: {
                  id: p.approval.approvalId,
                },
              } as UIMessagePart<UIDataTypes, UITools>;
            }
            return {
              type: p.type,
              state: p.state,
              input: JSON.parse(p.input ?? "{}"),
              toolCallId: p.toolCallId,
              output: p.output,
            } as UIMessagePart<UIDataTypes, UITools>;
          } else {
            return {
              type: p.type,
              text: p.text ?? "",
            } as UIMessagePart<UIDataTypes, UITools>;
          }
        }),
      };
