import { IMessagesQueries } from "@contracts";
import { IMessageModel, IMessagePartModel, MessageRoleType } from "@models";
import chatDb from "../database";
import { ICreateMessageDTO } from "@dto";
import { MessageWithPartRow } from "./types";
import { messagePartsQueries } from "./message-parts.queries";

export const messagesQueries: IMessagesQueries = {
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

    if (dto.parts && dto.parts.length > 0) {
      for (const part of dto.parts) {
        messagePartsQueries.create(messageId, part);
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
        p.output,

        a.id           AS approvalRowId,
        a.approvalId   AS approvalId,
        a.isApproved   AS isApproved

      FROM messages m
      LEFT JOIN messages_parts p
        ON m.id = p.messageId
      LEFT JOIN parts_approvals a
        ON p.id = a.partId
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

      if (!row.partId) continue;

      const message = messagesMap.get(row.id)!;

      let part = message.parts.find((p) => p.id === row.partId);

      if (!part) {
        part = {
          id: row.partId,
          messageId: row.id,
          type: row.type!,
          state: row.state,
          text: row.text,
          toolCallId: row.toolCallId,
          input: row.input,
          output: row.output,
        };

        message.parts.push(part);
      }

      if (row.approvalRowId) {
        part.approval = {
          id: row.approvalRowId,
          partId: row.partId,
          approvalId: row.approvalId!,
          isApproved: row.isApproved === null ? null : Boolean(row.isApproved),
        };
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

        p.id           AS partId,
        p.type,
        p.state,
        p.text,
        p.toolCallId,
        p.input,
        p.output,

        a.id           AS approvalRowId,
        a.approvalId   AS approvalId,
        a.isApproved   AS isApproved

      FROM messages m
      LEFT JOIN messages_parts p
        ON m.id = p.messageId
      LEFT JOIN parts_approvals a
        ON p.id = a.partId
      WHERE m.id = ?
      ORDER BY p.id ASC
    `,
      )
      .all(id) as MessageWithPartRow[];

    if (!rows.length) return null;

    const firstRow = rows[0];

    const partsMap = new Map<string, IMessagePartModel>();

    for (const row of rows) {
      if (!row.partId) continue;

      if (!partsMap.has(row.partId)) {
        partsMap.set(row.partId, {
          id: row.partId,
          messageId: row.id,
          type: row.type!,
          state: row.state,
          text: row.text,
          toolCallId: row.toolCallId,
          input: row.input,
          output: row.output,
        });
      }

      const part = partsMap.get(row.partId)!;

      if (row.approvalRowId) {
        part.approval = {
          id: row.approvalRowId,
          partId: row.partId,
          approvalId: row.approvalId!,
          isApproved: row.isApproved === null ? null : Boolean(row.isApproved),
        };
      }
    }

    return {
      id: firstRow.id,
      threadId: firstRow.threadId,
      role: firstRow.role as MessageRoleType,
      createdAt: firstRow.createdAt,
      parts: Array.from(partsMap.values()),
    };
  },
};
