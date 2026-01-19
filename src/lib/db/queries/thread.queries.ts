import { IThreadQueries } from "@contracts";
import { IThreadModel } from "@models";
import chatDb from "../database";
import { ICreateThreadDTO, ISetActiveStreamDTO } from "@dto";

export const threadQueries: IThreadQueries = {
  create: (dto: ICreateThreadDTO): string => {
    const id = crypto.randomUUID();

    chatDb
      .prepare(
        "INSERT INTO threads (id, title, activeStreamId) VALUES (?, ?, ?)",
      )
      .run(id, dto.title, dto.activeStreamId ?? null);

    return id;
  },

  setActiveStream: (dto: ISetActiveStreamDTO): void => {
    chatDb
      .prepare("UPDATE threads SET activeStreamId = ? WHERE id = ?")
      .run(dto.streamId, dto.threadId);
  },

  getAll: (): IThreadModel[] => {
    return chatDb
      .query("SELECT * FROM threads ORDER BY createdAt DESC")
      .all() as IThreadModel[];
  },

  getById: (id: string): IThreadModel | null => {
    return chatDb
      .query("SELECT * FROM threads WHERE id = ?")
      .get(id) as IThreadModel | null;
  },

  delete: (id: string): void => {
    chatDb.prepare("DELETE FROM threads WHERE id = ?").run(id);
  },
};
