"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useState, useEffect, FormEvent, useRef } from "react";
import SendMsgIcon from "@public/icons/send-msg.svg";

import styles from "./page.module.scss";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { IThreadModel } from "@models";
import { ChatInput } from "@components/chat-input";
import clsx from "clsx";
import { MarkdownText } from "@components/markdown-text";
import { ChatSidebar } from "@components/chat-sidebar";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IHighlightSectionData,
  ISendChatMessageParams,
  IShowStockPriceResult,
} from "@app/interfaces";
import { TransportFetchType } from "@app/types";
import {
  HighlightSectionType,
  Headers,
  QueryParams,
  HighlightSections,
  ApiRoutes,
} from "@app/constants";

export default function Page() {
  /** ссылка на контейнер сообщений */
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // списко тредов
  const [threads, setThreads] = useState<IThreadModel[]>([]);
  // Id текущего треда
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // сообщение, которое вводит пользователь
  const [inputValue, setInputValue] = useState("");

  // конфиг текущей подсветки
  const [highlight, setHighlight] = useState<IHighlightSectionData | null>(
    null
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Возвращает стили для подсветки секции
   *
   * @param sectionName секция для подсветки
   * @returns CSS стили
   */
  const getHighlightStyle = (sectionName: HighlightSectionType) => {
    if (highlight?.section === sectionName) {
      return {
        boxShadow: `0 0 0 4px ${highlight.color}`,
        transition: "all 0.3s ease-in-out",
      };
    }
    return {};
  };

  /**
   * Загружает свежие треды
   */
  const loadThreads = async () => {
    const res = await fetch(ApiRoutes.getAllThreads);
    const data = await res.json();
    setThreads(data);
  };

  /**
   * Загружает сообщения треда
   *
   * @param threadId айди треда
   */
  const loadThreadMessages = async (threadId: string) => {
    setActiveThreadId(threadId);
    const res = await fetch(ApiRoutes.getAllThreadMessages(threadId));
    const data = await res.json();
    setMessages(data);
  };

  /**
   * Обработчик отправки сообщения
   */
  const onMsgSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    sendMessage({ text: inputValue });
    setInputValue("");
  };

  /**
   * Обрабатывает создание нового чата
   */
  const handleCreateNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setInputValue("");
  };

  const {
    messages,
    sendMessage,
    setMessages,
    addToolOutput,
    addToolApprovalResponse,
  } = useChat<UIMessage>({
    messages: [],
    id: activeThreadId || undefined,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          message: messages.at(-1),
          threadId: activeThreadId,
        } as ISendChatMessageParams,
      }),
      fetch: (async (input: string | URL | Request, init?: RequestInit) => {
        const response = await fetch(input, init);
        const serverThreadId = response.headers.get(Headers.threadId);

        // если создался новый тред
        if (serverThreadId && !activeThreadId) {
          queueMicrotask(() => {
            setActiveThreadId(serverThreadId);
            loadThreads();
            loadThreadMessages(serverThreadId);
          });
        }
        return response;
      }) as TransportFetchType,
    }),
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "highlightSection") {
        const { section, color } = toolCall.input as IHighlightSectionData;

        setHighlight({ section, color });

        addToolOutput({
          tool: "highlightSection",
          toolCallId: toolCall.toolCallId,
          output: "Successfully highlighted",
        });
      }
    },
  });

  // при инициализации подгружает все треды
  useEffect(() => {
    loadThreads();
  }, []);

  // реагирует на смену query параметров
  useEffect(() => {
    const threadIdFromQuery = searchParams.get(QueryParams.threadId);

    if (threadIdFromQuery && threadIdFromQuery !== activeThreadId) {
      setActiveThreadId(threadIdFromQuery);
      loadThreadMessages(threadIdFromQuery);
    }
  }, [searchParams]);

  // обновляет query параметры
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (activeThreadId) {
      params.set(QueryParams.threadId, activeThreadId);
    } else {
      params.delete(QueryParams.threadId);
    }

    router.replace(`${window.location.pathname}?${params.toString()}`);
  }, [activeThreadId]);

  // сбрасывает подсветку через 3 секунды
  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => setHighlight(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // вешает observer на контейнер с сообщениями
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    // TODO: эту логику нужно делать нормальной для более сложного чата
    const observer = new MutationObserver(() => {
      // скроллим вниз при появлении нового сообщения
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
      <aside style={getHighlightStyle(HighlightSections.sidebar)}>
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChatClick={handleCreateNewChat}
          onSelectThread={loadThreadMessages}
        />
      </aside>

      <main
        className={styles.chatArea}
        style={getHighlightStyle(HighlightSections.chat)}
      >
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
                {m.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <MarkdownText key={i} text={part.text} />;

                    case "tool-showStockPrice": {
                      const callId = part.toolCallId;

                      if (part.state === "output-available") {
                        const output = part.output as IShowStockPriceResult;

                        return (
                          <div key={callId} className={styles.stockWidget}>
                            <b>{output.symbol}</b>: ${output.price}
                          </div>
                        );
                      }

                      return <div key={callId}>Загрузка котировок...</div>;
                    }

                    case "tool-deleteThread": {
                      switch (part.state) {
                        case "approval-requested":
                          return (
                            <div
                              key={part.toolCallId}
                              className={styles.confirmBox}
                            >
                              <p>Удалить этот чат? </p>
                              <div className={styles.btnGroup}>
                                <button
                                  onClick={() =>
                                    addToolApprovalResponse({
                                      id: part.approval.id,
                                      approved: true,
                                    })
                                  }
                                >
                                  Да, удалить
                                </button>
                                <button
                                  onClick={() =>
                                    addToolApprovalResponse({
                                      id: part.approval.id,
                                      approved: false,
                                    })
                                  }
                                >
                                  Нет
                                </button>
                              </div>
                            </div>
                          );
                        case "output-available":
                          return (
                            <div
                              key={part.toolCallId}
                              className={styles.systemMsg}
                            >
                              Тред удален
                            </div>
                          );
                        default:
                          return null;
                      }
                    }

                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={onMsgSubmit}
          className={styles.inputFormContainer}
          style={getHighlightStyle(HighlightSections.input)}
        >
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
