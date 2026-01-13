"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useState, useEffect, FormEvent, useRef } from "react";
import SendMsgIcon from "@public/icons/send-msg.svg";

import styles from "./page.module.scss";
import { DefaultChatTransport, HttpChatTransportInitOptions } from "ai";
import { IThreadModel } from "@models";
import { ChatInput } from "@components/chat-input";
import clsx from "clsx";
import { MarkdownText } from "@components/markdown-text";
import { ChatSidebar } from "@components/chat-sidebar";

type TransportFetch = NonNullable<
  HttpChatTransportInitOptions<UIMessage>["fetch"]
>;

export default function Page() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [threads, setThreads] = useState<IThreadModel[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  // TODO: инкапсулировать в кастомном хуке
  const { messages, sendMessage, setMessages } = useChat<UIMessage>({
    messages: [],
    id: activeThreadId || undefined,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, threadId: activeThreadId },
      }),

      fetch: (async (input: string | URL | Request, init?: RequestInit) => {
        const response = await fetch(input, init);
        const serverThreadId = response.headers.get("x-thread-id");

        if (serverThreadId && !activeThreadId) {
          queueMicrotask(() => {
            setActiveThreadId(serverThreadId);
            fetchThreads();
          });
        }

        return response;
      }) as TransportFetch,
    }),
  });

  const fetchThreads = async () => {
    // TODO: добавить loading state
    const res = await fetch("/api/threads");
    const data = await res.json();
    setThreads(data);
  };

  const loadThreadMessages = async (id: string) => {
    setActiveThreadId(id);
    const res = await fetch(`/api/threads/${id}/messages`);
    const data = await res.json();

    setMessages(data);
  };

  const onMsgSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    sendMessage({
      text: inputValue,
    });

    setInputValue("");
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setInputValue("");
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      container.scrollTop = container.scrollHeight;
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [activeThreadId]);

  return (
    <div className={styles.container}>
      <aside>
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChatClick={handleNewChat}
          onSelectThread={loadThreadMessages}
        />
      </aside>

      <main className={styles.chatArea}>
        <div ref={messagesContainerRef} className={styles.messagesContainer}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={clsx(
                styles.messageRow,
                m.role === "user" ? styles.user : styles.ai
              )}
            >
              <div className={styles.content}>
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MarkdownText key={i} text={part.text} />
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onMsgSubmit} className={styles.inputFormContainer}>
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Введите сообщение..."
          />
          <div className={styles.inputHelpersContainer}>
            <button className={styles.submitBtn} type="submit">
              <SendMsgIcon />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
