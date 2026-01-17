import { IMessagePartQueries } from "@contracts";
import chatDb from "../database";
import { ICreateMessagePartDTO } from "@models";

export const messagePartsQueries: IMessagePartQueries = {
  create: (messageId: string, part: ICreateMessagePartDTO): string => {
    const partId = crypto.randomUUID();

    chatDb
      .prepare(
        `
        INSERT INTO messages_parts
          (id, message_id, type, state, text, toolCallId, input, output)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        partId,
        messageId,
        part.type,
        part.state ?? "",
        part.text ?? "",
        part.toolCallId ?? "",
        part.input ?? "",
        part.output ?? "",
      );

    return partId;
  },
};
