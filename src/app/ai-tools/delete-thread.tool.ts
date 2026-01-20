import { IDeleteThreadResult } from "@app/interfaces";
import { threadsQueries } from "@db";
import { tool as createTool } from "ai";
import { z } from "zod";

export const deleteThread = createTool({
  needsApproval: true,

  description: "Удалить существующий чат-тред из базы данных. ",

  inputSchema: z.object({
    threadId: z
      .string()
      .describe(
        "Уникальный идентификатор треда, который пользователь запросил удалить",
      ),
  }),

  outputSchema: z.object({
    deletedId: z
      .string()
      .describe("Идентификатор треда, который был успешно удалён"),

    message: z
      .string()
      .describe("Человекочитаемое сообщение о результате операции удаления"),
  }),

  execute: async ({ threadId }): Promise<IDeleteThreadResult> => {
    threadsQueries.delete(threadId);
    return { deletedId: threadId, message: "Тред успешно удален" };
  },
});
