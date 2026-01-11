import { threadQueries, messageQueries } from "./queries";

async function seed() {
  console.log("🌱 Начинаем заполнение базы данных...");

  try {
    // 1. Создаем первый тред (Чат о TypeScript)
    const threadId1 = threadQueries.create({
      title: "Изучение TypeScript",
    });

    messageQueries.create({
      thread_id: threadId1,
      role: "user",
      content: "Привет! Расскажи мне про Generic типы в TS.",
    });

    messageQueries.create({
      thread_id: threadId1,
      role: "assistant",
      content:
        "Привет! Генерики позволяют создавать компоненты, которые работают с различными типами, а не с одним единственным.",
    });

    // 2. Создаем второй тред (Чат про Next.js)
    const threadId2 = threadQueries.create({
      title: "Разработка на Next.js 15",
    });

    messageQueries.create({
      thread_id: threadId2,
      role: "user",
      content: "Как работают Server Actions?",
    });

    console.log("✅ База успешно заполнена тестовыми данными!");
  } catch (error) {
    console.error("❌ Ошибка при заполнении базы:", error);
  }
}

seed();
