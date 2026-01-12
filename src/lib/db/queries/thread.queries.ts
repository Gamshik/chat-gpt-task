import { IThreadQueries } from "@contracts";
import { ICreateThreadDTO, IThreadModel } from "@models";
import chatDb from "../database";

export const threadQueries: IThreadQueries = {
  create: (dto: ICreateThreadDTO): string => {
    const id = crypto.randomUUID();
    chatDb
      .prepare("INSERT INTO threads (id, title) VALUES (?, ?)")
      .run(id, dto.title);
    return id;
  },

  getAll: (): IThreadModel[] => {
    return chatDb
      .query("SELECT * FROM threads ORDER BY created_at DESC")
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
