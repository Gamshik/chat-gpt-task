import { IMessagePartQueries } from "@contracts";
import chatDb from "../database";
import { ICreateMessagePartDTO } from "@dto";

export const messagePartsQueries: IMessagePartQueries = {
  create: (messageId: string, part: ICreateMessagePartDTO): string => {
    const partId = crypto.randomUUID();

    chatDb
      .prepare(
        `
        INSERT INTO messages_parts
          (id, messageId, type, state, text, toolCallId, input, output)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        partId,
        messageId,
        part.type,
        part.state ?? null,
        part.text ?? null,
        part.toolCallId ?? null,
        part.input ?? null,
        part.output ?? null,
      );

    return partId;
  },
};
