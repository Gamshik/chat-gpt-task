import { HighlightSections } from "@app/constants";
import { tool as createTool } from "ai";
import { z } from "zod";

export const highlightSection = createTool({
  description:
    "Подсветить одну из секций пользовательского интерфейса " +
    "для привлечения внимания пользователя (например, chat, sidebar или input). " +
    "Используется только для визуального UI-отклика и не изменяет данные.",

  inputSchema: z.object({
    section: z
      .enum(Object.values(HighlightSections))
      .describe(
        "Секция интерфейса, которую нужно подсветить (sidebar, chat или input)",
      ),
    color: z
      .string()
      .describe(
        "CSS-цвет подсветки (например: 'red', '#ff0000', 'rgba(255,0,0,0.4)')",
      ),
  }),
});
