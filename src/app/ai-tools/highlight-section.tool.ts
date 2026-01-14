import { HighlightSections } from "@app/constants";
import { tool as createTool } from "ai";
import { z } from "zod";

export const highlightSection = createTool({
  description: "Подсветить/выделить визуально секцию интерфейса",
  inputSchema: z.object({
    section: z
      .enum(Object.values(HighlightSections))
      .describe("Секция, которую пользователь хочет подсветить/выделить"),
    color: z.string().describe("CSS цвет"),
  }),
});
