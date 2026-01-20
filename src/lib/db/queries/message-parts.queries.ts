import { IMessagePartsQueries } from "@contracts";
import chatDb from "../database";
import { ICreateMessagePartDTO } from "@dto";
import { partApprovalQueries } from "./part-approval.queries";

export const messagePartsQueries: IMessagePartsQueries = {
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

    if (part.approval) partApprovalQueries.create(partId, part.approval);

    return partId;
  },
};
