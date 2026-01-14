import { IDeleteThreadResult } from "@app/interfaces";
import { threadQueries } from "@db";
import { tool as createTool } from "ai";
import { z } from "zod";

export const deleteThread = createTool({
  needsApproval: true,
  description: "Удалить тред из базы данных.",
  inputSchema: z.object({
    threadId: z
      .string()
      .describe("Id треда, который пользователь хочет удалить"),
  }),
  execute: async ({ threadId }): Promise<IDeleteThreadResult> => {
    threadQueries.delete(threadId);
    return { deletedId: threadId, message: "Тред успешно удален" };
  },
});
