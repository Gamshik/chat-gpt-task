import { IMessageQueries } from "@/contracts/db";
import { ICreateMessageDTO, IMessageModel } from "@/types";
import chatDb from "../database";

export const messageQueries: IMessageQueries = {
  create: (dto: ICreateMessageDTO): string => {
    const id = crypto.randomUUID();
    chatDb
      .prepare(
        `
      INSERT INTO messages (id, thread_id, role, content) 
      VALUES (?, ?, ?, ?)
    `
      )
      .run(id, dto.thread_id, dto.role, dto.content);
    return id;
  },

  getByThreadId: (threadId: string): IMessageModel[] => {
    return chatDb
      .query(
        "SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC"
      )
      .all(threadId) as IMessageModel[];
  },
};
