import { IMessageQueries } from "@contracts";
import { IMessageModel, IMessagePartModel } from "@models";
import chatDb from "../database";
import { ICreateMessageDTO } from "@dto";

export const messageQueries: IMessageQueries = {
  create: (dto: ICreateMessageDTO): string => {
    const messageId = crypto.randomUUID();

    chatDb
      .prepare(
        `
        INSERT INTO messages (id, thread_id, role) 
        VALUES (?, ?, ?)
      `,
      )
      .run(messageId, dto.threadId, dto.role);

    // вставляем части сообщения, если есть
    if (dto.parts && dto.parts.length > 0) {
      const stmt = chatDb.prepare(`
        INSERT INTO messages_parts 
          (id, message_id, type, state, text, toolCallId, input, output)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const part of dto.parts) {
        stmt.run(
          crypto.randomUUID(),
          messageId,
          part.type,
          part.state ?? null,
          part.text ?? null,
          part.toolCallId ?? null,
          part.input ?? null,
          part.output ?? null,
        );
      }
    }

    return messageId;
  },

  getByThreadId: (threadId: string): IMessageModel[] => {
    const messagesRaw = chatDb
      .query(
        `
        SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC
      `,
      )
      .all(threadId) as Omit<IMessageModel, "parts">[];

    return messagesRaw.map((msg) => {
      const parts = chatDb
        .query(
          "SELECT * FROM messages_parts WHERE message_id = ? ORDER BY id ASC",
        )
        .all(msg.id) as IMessagePartModel[];

      return {
        ...msg,
        parts,
      };
    });
  },
};
