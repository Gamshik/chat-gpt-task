import { IMessageQueries } from "@contracts";
import { IMessageModel, IMessagePartModel, MessageRoleType } from "@models";
import chatDb from "../database";
import { ICreateMessageDTO } from "@dto";
import { MessageWithPartRow } from "./types";

export const messageQueries: IMessageQueries = {
  create: (dto: ICreateMessageDTO): string => {
    const messageId = crypto.randomUUID();

    chatDb
      .prepare(
        `
        INSERT INTO messages (id, threadId, role) 
        VALUES (?, ?, ?)
      `,
      )
      .run(messageId, dto.threadId, dto.role);

    // вставляем части сообщения, если есть
    if (dto.parts && dto.parts.length > 0) {
      const stmt = chatDb.prepare(`
        INSERT INTO messages_parts 
          (id, messageId, type, state, text, toolCallId, input, output)
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
    const rows = chatDb
      .query(
        `
      SELECT 
        m.id,
        m.threadId,
        m.role,
        m.createdAt,
        p.id as partId,
        p.type,
        p.state,
        p.text,
        p.toolCallId,
        p.input,
        p.output
      FROM messages m
      LEFT JOIN messages_parts p
        ON m.id = p.messageId
      WHERE m.threadId = ?
      ORDER BY m.createdAt ASC, p.id ASC
    `,
      )
      .all(threadId) as MessageWithPartRow[];

    if (!rows || rows.length === 0) return [];

    // сгруппируем строки по сообщению
    const messagesMap = new Map<string, IMessageModel>();

    for (const row of rows) {
      if (!messagesMap.has(row.id)) {
        messagesMap.set(row.id, {
          id: row.id,
          threadId: row.threadId,
          role: row.role as MessageRoleType,
          createdAt: row.createdAt,
          parts: [],
        });
      }

      // если есть часть, добавляем её
      if (row.partId !== null) {
        messagesMap.get(row.id)!.parts.push({
          id: row.partId!,
          messageId: row.id,
          type: row.type!,
          state: row.state,
          text: row.text,
          toolCallId: row.toolCallId,
          input: row.input,
          output: row.output,
        });
      }
    }

    return Array.from(messagesMap.values());
  },

  getById: (id: string): IMessageModel | null => {
    const rows = chatDb
      .query(
        `
    SELECT 
      m.id,
      m.threadId,
      m.role,
      m.createdAt,
      p.id as partId,
      p.type,
      p.state,
      p.text,
      p.toolCallId,
      p.input,
      p.output
    FROM messages m
    LEFT JOIN messages_parts p
      ON m.id = p.messageId
    WHERE m.id = ?
    ORDER BY p.id ASC
  `,
      )
      .all(id) as MessageWithPartRow[];

    if (!rows || rows.length === 0) return null;

    const parts: IMessagePartModel[] = rows
      .filter((r) => r.partId !== null)
      .map((r) => ({
        id: r.partId!,
        messageId: r.id,
        type: r.type!,
        state: r.state,
        text: r.text,
        toolCallId: r.toolCallId,
        input: r.input,
        output: r.output,
      }));

    const firstRow = rows[0];

    return {
      id: firstRow.id,
      threadId: firstRow.threadId,
      role: firstRow.role as MessageRoleType,
      createdAt: firstRow.createdAt,
      parts,
    };
  },
};
