"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useState, useEffect, FormEvent, useRef } from "react";
import SendMsgIcon from "@public/icons/send-msg.svg";
import OpenSidebarIcon from "@public/icons/toggle-sidebar.svg";

import styles from "./styles.module.scss";
import {
  DefaultChatTransport,
  HttpChatTransportInitOptions,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { IThreadModel } from "@models";
import { ChatInput } from "@components/chat-input";
import clsx from "clsx";
import { MarkdownText } from "@components/markdown-text";
import { ChatSidebar } from "@components/chat-sidebar";
import { useRouter } from "next/navigation";
import { ISendChatMessageParams, IShowStockPriceResult } from "@app/interfaces";
import {
  HighlightSectionType,
  Headers,
  QueryParams,
  HighlightSections,
  ApiRoutes,
} from "@app/constants";
import { useResizeWindow } from "@app/hooks";

//#region types/interfaces

type TransportFetchType = NonNullable<
  HttpChatTransportInitOptions<UIMessage>["fetch"]
>;

interface IHighlightSectionData {
  section: HighlightSectionType;
  color: string;
}

//#endregion

export default function Page() {
  /** ссылка на контейнер сообщений */
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  /** ссылка на контейнер сайдбара */
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  /** ссылка на кнопку для открытия сайдбара */
  const openSidebarBtnRef = useRef<HTMLButtonElement>(null);

  // списко тредов
  const [threads, setThreads] = useState<IThreadModel[]>([]);
  // Id текущего треда
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // сообщение, которое вводит пользователь
  const [inputValue, setInputValue] = useState("");

  // конфиг текущей подсветки
  const [highlight, setHighlight] = useState<IHighlightSectionData | null>(
    null,
  );
  // флаг установки компонента
  const [isMounted, setIsMounted] = useState<boolean>(false);
  // флаг состояния сайдбара
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { isMobile } = useResizeWindow();

  const router = useRouter();
  // const searchParams = useSearchParams();

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
    const res = await fetch(ApiRoutes.getAllThreadMessages(threadId));

    if (res.status === 404) {
      // если тред не найден
      setActiveThreadId(null);
      return;
    }

    setActiveThreadId(threadId);

    const data = (await res.json()) as UIMessage[];
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
   * Обрабатывает создание нового треда
   */
  const handleCreateNewThread = () => {
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
    resumeStream,
  } = useChat<UIMessage>({
    messages: [],
    id: activeThreadId || undefined,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: async (res) => {
      console.log("activeThreadId", activeThreadId);
      console.log("res", res);
    },
    transport: new DefaultChatTransport({
      prepareReconnectToStreamRequest: () => ({
        api: `/api/chat/${activeThreadId}/stream`,
      }),
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
          setActiveThreadId(serverThreadId);
          loadThreads();
          loadThreadMessages(serverThreadId);
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
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: "Successfully highlighted",
        });
      }
    },
  });

  // инициализация
  useEffect(() => {
    // загружаем тредлы
    loadThreads();

    setIsMounted(true);
  }, []);

  // если в query изначально есть параметр threadId, загружаются сообщения
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const threadIdFromQuery = params.get(QueryParams.threadId);

    if (!threadIdFromQuery) return;

    setActiveThreadId(threadIdFromQuery);
    loadThreadMessages(threadIdFromQuery);
  }, []);

  // меняет состояние сайдбара при сжатии/расширении окна
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          sidebarContainerRef.current &&
          !sidebarContainerRef.current.contains(event.target as Node) &&
          (!openSidebarBtnRef ||
            (openSidebarBtnRef.current &&
              !openSidebarBtnRef.current.contains(event.target as Node)))
        ) {
          setIsSidebarOpen(false);
        }
      };

      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isMobile, isSidebarOpen]);

  useEffect(() => {
    if (activeThreadId) resumeStream();
  }, [activeThreadId]);

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
      {/* чтобы сайдбар не прыгал при инициализации на мобилке - рисуем только после инициализации */}
      {isMounted && (
        <>
          {isMobile && (
            <div
              data-show={isSidebarOpen}
              className={clsx(styles.overlay)}
            ></div>
          )}

          <aside
            ref={sidebarContainerRef}
            data-open={isSidebarOpen}
            style={getHighlightStyle(HighlightSections.sidebar)}
            className={styles.sidebarContainer}
          >
            <ChatSidebar
              threads={threads}
              activeThreadId={activeThreadId}
              onClose={() => setIsSidebarOpen(false)}
              onNewChat={handleCreateNewThread}
              onSelectThread={loadThreadMessages}
            />
          </aside>

          {/* TODO: исправить user select */}
          <div
            data-open={!isSidebarOpen}
            className={styles.openSidebarBtnContainer}
          >
            <button
              ref={openSidebarBtnRef}
              className={styles.openSidebarBtn}
              onClick={() => setIsSidebarOpen(true)}
            >
              <OpenSidebarIcon />
            </button>
          </div>
        </>
      )}

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
                m.role === "user" ? styles.user : styles.ai,
              )}
            >
              <div className={styles.content}>
                {m.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <MarkdownText key={i} text={part.text} />;

                    case "tool-showStockPrice": {
                      if (part.state === "output-available") {
                        let output: IShowStockPriceResult;
                        if (typeof part.output === "string") {
                          output = JSON.parse(
                            part.output,
                          ) as IShowStockPriceResult;
                        } else {
                          output = part.output as IShowStockPriceResult;
                        }

                        return (
                          <div key={i} className={styles.stockWidget}>
                            <b>{output.symbol}</b>: ${output.price}
                          </div>
                        );
                      }

                      return <div key={i}>Загрузка котировок...</div>;
                    }

                    case "tool-highlightSection": {
                      switch (part.state) {
                        case "input-streaming":
                          return <div key={i}>Подготовка запроса...</div>;
                        case "input-available":
                          return <div key={i}>Получение данных...</div>;
                        case "output-available":
                          return <div key={i}>Успешно подсвечено</div>;
                        case "output-error":
                          return (
                            <div key={i}>
                              Ошибка подсветки: {part.errorText}
                            </div>
                          );
                      }
                      break;
                    }

                    case "tool-deleteThread": {
                      switch (part.state) {
                        case "approval-requested":
                          return (
                            <div key={i} className={styles.confirmBox}>
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
