import { MessageRole } from "@models";
import { threadQueries, messageQueries, messagePartsQueries } from "./queries";

const TOPICS = [
  "Проектирование БД",
  "Секреты CSS Grid",
  "Оптимизация Bun",
  "React Server Components",
  "Планы на выходные",
];

const USER_MESSAGES = [
  "А как это работает под капотом?",
  "Можешь привести пример кода?",
  "Это звучит сложно, давай попробуем упростить.",
  "Окей, а есть альтернативные варианты?",
  "Слушай, а если я захочу масштабировать это решение, что посоветуешь?",
  "Краткость — сестра таланта, распиши по пунктам.",
  "Спасибо! А что насчет безопасности в этом подходе?",
];

const AI_MESSAGES = [
  "Конечно! Основная идея заключается в том, чтобы изолировать логику от представления данных.",
  "Вот пример реализации: `const data = await db.query('SELECT * FROM users')`. Как видишь, всё довольно прямолинейно.",
  "Это отличный вопрос. Согласно документации, такой подход позволяет сэкономить до 30% ресурсов процессора при высоких нагрузках.",
  "Если рассматривать альтернативы, то я бы взглянул на использование кэширования на стороне клиента.",
  "Важно помнить, что в разработке всегда есть компромиссы между скоростью написания кода и его производительностью в будущем.",
  "Я подготовил для тебя список из 5 ключевых моментов, на которые стоит обратить внимание при деплое.",
  "Интересный факт: этот паттерн проектирования был популярен еще в начале 2000-х, но сейчас он обрел второе дыхание.",
];

async function seed() {
  console.log("Начинаем генерацию сида...");

  try {
    for (const topic of TOPICS) {
      const threadId = threadQueries.create({ title: topic });

      const messageCount = Math.floor(Math.random() * 5) + 6;

      for (let i = 0; i < messageCount; i++) {
        const isUser = i % 2 === 0;
        const contentPool = isUser ? USER_MESSAGES : AI_MESSAGES;

        // основная часть сообщения
        let mainText =
          contentPool[Math.floor(Math.random() * contentPool.length)];

        if (Math.random() > 0.7) {
          mainText +=
            " " + contentPool[Math.floor(Math.random() * contentPool.length)];
        }

        // создаём сообщение
        const messageId = messageQueries.create({
          threadId: threadId,
          role: isUser ? MessageRole.User : MessageRole.Assistant,
          parts: [
            {
              type: "text",
              text: mainText,
            },
          ],
        });

        // иногда добавляем дополнительную часть
        if (Math.random() > 0.6) {
          messagePartsQueries.create(messageId, {
            type: "text",
            text: "Дополнительная часть для примера.",
          });
        }
      }
    }

    console.log("База успешно заполнена! Чат готов к использованию.");
  } catch (error) {
    console.error("Ошибка при заполнении базы:", error);
  }
}

seed();
