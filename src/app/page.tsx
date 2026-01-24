"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import {
  useState,
  useEffect,
  FormEvent,
  useRef,
  useCallback,
  useMemo,
} from "react";
import SendMsgIcon from "@public/icons/send-msg.svg";
import OpenSidebarIcon from "@public/icons/toggle-sidebar.svg";

import styles from "./styles.module.scss";
import {
  DefaultChatTransport,
  HttpChatTransportInitOptions,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { IMessageModel, IThreadModel, MessageRole } from "@models";
import { ChatInput } from "@components/chat-input";
import clsx from "clsx";
import { MarkdownText } from "@components/markdown-text";
import { ChatSidebar } from "@components/chat-sidebar";
import { useRouter } from "next/navigation";
import {
  IGetTableRangeToolResult,
  ISendChatMessageParams,
  IShowStockPriceToolResult,
  ISimpleMessagePart,
  IToolPart,
} from "@app/interfaces";
import {
  HighlightSectionType,
  Headers,
  QueryParams,
  HighlightSections,
  ApiRoutes,
} from "@app/constants";
import { useResizeWindow } from "@app/hooks";
import { ICreateMessageDTO } from "@dto";
import { messageModelToUi } from "@app/utils";
import { TablePreview } from "@components/table-preview";

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
  /** Ссылка на контейнер сообщений */
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  /** Ссылка на контейнер сайдбара */
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  /** Ссылка на кнопку для открытия сайдбара */
  const openSidebarBtnRef = useRef<HTMLButtonElement>(null);

  // список тредов
  const [threads, setThreads] = useState<IThreadModel[]>([]);
  // id текущего треда
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // сообщение, которое вводит пользователь
  const [inputValue, setInputValue] = useState("");

  // флаг доступности отправки сообщений
  const [isSendMsgAvailable, setIsSendMsgAvailable] = useState<boolean>(true);

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

  /**
   * Колбэк вставляет меншон в инпут
   */
  const setMentionToInput = useCallback(
    (mention: string) => setInputValue((prev) => prev + " " + mention),
    [],
  );

  /**
   * Возвращает стили для подсветки секции
   *
   * @param sectionName секция для подсветки
   * @returns CSS стили
   */
  const getHighlightStyle = (sectionName: HighlightSectionType) => {
    if (highlight?.section === sectionName) {
      return {
        boxShadow: `0 0 10px 1px ${highlight.color}`,
      };
    }
    return {};
  };

  /**
   * Создаёт сообщение
   *
   * @param dto данные
   * @returns созданное сообщение
   */
  const createMessage = async (dto: ICreateMessageDTO) => {
    const res = await fetch(ApiRoutes.createMessage(dto.threadId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error(await res.text());

    return res.json();
  };

  // TODO: сделать запросы через tanstack
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
      void loadThreads();
      return;
    }

    setActiveThreadId(threadId);

    const data = (await res.json()) as IMessageModel[];

    const uiMessages = data
      .map((m) => messageModelToUi(m))
      .filter((m): m is UIMessage => m !== null);

    setMessages(uiMessages);
  };

  /**
   * Обработчик отправки сообщения
   */
  const onMessagegSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    if (!inputValue.trim()) return;

    sendMessage({ text: inputValue });
    setIsSendMsgAvailable(false);
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

  /**
   * Подтверждает действие
   *
   * @param approvalId идентификатор действия
   */
  const onConfirmApprovalClick = (approvalId: string) => () => {
    addToolApprovalResponse({
      id: approvalId,
      approved: true,
    });
  };

  /**
   * Запрещает действие
   *
   * @param approvalId идентификатор действия
   */
  const onDenyApprovalClick = (approvalId: string) => () => {
    addToolApprovalResponse({
      id: approvalId,
      approved: false,
    });
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
      if (!activeThreadId) return;

      setIsSendMsgAvailable(true);

      const isThreadDeleted = res.message.parts.some(
        (p) =>
          p.type === "tool-deleteThread" && p.approval && p.approval.approved,
      );

      if (isThreadDeleted) {
        void loadThreads();
        // если мы удалили текущий тред, то при загрузке сообщений получим 404 и обработаем
        // TODO: выглядит как костыль, поэтому не мешало бы иначе это делать
        void loadThreadMessages(activeThreadId);
        return;
      }

      const highlightResult = res.message.parts.find(
        (p) =>
          p.type === "tool-highlightSection" && p.state === "output-available",
      ) as IToolPart;

      // TODO: может быть тут тоже нужно сохранять степы - step-start, reasoning
      // пока не хочу так делать, ибо получится, что у нас фронт будет знать о подобных состояниях,
      // а сейчас он о них и не знает, тут мы с ними не работаем, это нужно лишь иишке
      if (res.message.role === "assistant" && highlightResult) {
        // TODO: как будто это всё равно костыль, мб переделать
        await createMessage({
          threadId: activeThreadId,
          role: MessageRole.Assistant,
          parts: [
            {
              type: "tool-highlightSection",
              state: "output-available",
              output: highlightResult.output as string,
              toolCallId: highlightResult.toolCallId,
            },
          ],
        });

        void loadThreadMessages(activeThreadId);
      }
    },
    transport: new DefaultChatTransport({
      prepareReconnectToStreamRequest: () => ({
        // TODO (bug): если я юзаю тут ApiRoutes, то запрос не идёт
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
          await loadThreads();
          setActiveThreadId(serverThreadId);
          void loadThreadMessages(serverThreadId);
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
          output: "Успешно подсвечено",
        });
      }
    },
  });

  /**
   * Возвращает строку с инфой об апрувнутом запросе
   *
   * @param type тип
   * @param approvalId идентификатор апрува
   * @returns строка
   */
  const toRespondedApprovalStr = (type: string, approvalId: string) =>
    `${type}:${approvalId}`;

  /** Сет аппрувнутых запросов */
  const respondedApprovals = useMemo(() => {
    const approvals = new Set<string>();

    for (let i = 0; i < messages.length; i++) {
      const curMsg = messages[i];
      for (let j = 0; j < curMsg.parts.length; j++) {
        const curPart = curMsg.parts[j] as IToolPart;

        if (!curPart.type.startsWith("tool-")) continue;

        if (curPart.state === "approval-responded")
          approvals.add(
            toRespondedApprovalStr(curPart.type, curPart.approval!.id),
          );
      }
    }

    return approvals;
  }, [messages]);

  // инициализация
  useEffect(() => {
    // загружаем тредлы
    void loadThreads();

    setIsMounted(true);
  }, []);

  // если в query изначально есть параметр threadId, загружаются сообщения
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const threadIdFromQuery = params.get(QueryParams.threadId);

    if (!threadIdFromQuery) return;

    setActiveThreadId(threadIdFromQuery);
    void loadThreadMessages(threadIdFromQuery);
  }, []);

  // меняет состояние сайдбара при сжатии/расширении окна
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // на мобилке при открытом сайдбаре вешает событие,
  // которое отслеживает нажатие на оверлей
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
    // TODO: FIX - когда база пустая, пишешь первое сообщение - иногда возвращает 204
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

  // сбрасывает подсветку через 5 секунд
  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => setHighlight(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // вешает observer на контейнер с сообщениями
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

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
          {/* TODO (bug):
            в хроме если ресайзишь с десктопа на мобилку и обратно, почему-то нужно рефрешить, чтобы сработало.
            В мозиле работает нормально */}
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
                  const simplePart = part as ISimpleMessagePart;

                  // потому что иишка сама отвечает на ошибки текстом, а видеть юзеру ошибки бэка не нужно
                  if (simplePart.state && simplePart.state === "output-error")
                    return null;

                  switch (part.type) {
                    case "text":
                      return <MarkdownText key={i} text={part.text} />;

                    case "tool-showStockPrice": {
                      if (part.state === "output-available") {
                        let output: IShowStockPriceToolResult;
                        if (typeof part.output === "string") {
                          output = JSON.parse(
                            part.output,
                          ) as IShowStockPriceToolResult;
                        } else {
                          output = part.output as IShowStockPriceToolResult;
                        }

                        // TODO: если будет больше инфы, то лучше вынести в отдельный компонент
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
                          return (
                            <div key={i}>{(part.output as string) ?? ""}</div>
                          );
                        case "output-error":
                          return (
                            <div key={i}>
                              Ошибка подсветки: {part.errorText ?? ""}
                            </div>
                          );
                      }
                      break;
                    }

                    // TODO: пофиксить UX:
                    // когда юзер апрувает/денаит удаление массив messages на фронте отображает 2 сообщения - запрос и ответ иишки на действие
                    // потом, при перезагрузке, мы видим всё общение - запрос, аппрув/денай, ответ иишки
                    // хотелось бы, чтобы когда юзер аппрувал/денаил мы сразу видели фулл общение, без перезагрузки
                    // пока что не понимаю почему так происходит
                    case "tool-deleteThread": {
                      switch (part.state) {
                        case "approval-requested":
                          return (
                            <div key={i} className={styles.confirmBox}>
                              <p className={styles.confitmText}>
                                Удалить этот чат?
                              </p>
                              {!respondedApprovals.has(
                                toRespondedApprovalStr(
                                  part.type,
                                  part.approval.id,
                                ),
                              ) && (
                                <div className={styles.btnGroup}>
                                  <button
                                    className={clsx(styles.btn, styles.confirm)}
                                    onClick={onConfirmApprovalClick(
                                      part.approval.id,
                                    )}
                                  >
                                    Да
                                  </button>
                                  <button
                                    className={clsx(styles.btn, styles.deny)}
                                    onClick={onDenyApprovalClick(
                                      part.approval.id,
                                    )}
                                  >
                                    Нет
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        case "approval-responded":
                          return (
                            <p key={i}>
                              {part.approval.approved ? "Да" : "Нет"}
                            </p>
                          );
                        default:
                          return null;
                      }
                    }

                    case "tool-getTableRange": {
                      if (part.state === "output-available") {
                        const output =
                          typeof part.output === "string"
                            ? JSON.parse(part.output)
                            : (part.output as IGetTableRangeToolResult);

                        return (
                          <TablePreview
                            key={i}
                            sheet={output.sheet}
                            range={output.range}
                            rows={output.rows}
                            setMention={setMentionToInput}
                          />
                        );
                      }

                      return <div key={i}>Загрузка таблицы...</div>;
                    }

                    case "tool-updateTableCell": {
                      switch (part.state) {
                        case "approval-requested":
                          return (
                            <div key={i} className={styles.confirmBox}>
                              <p className={styles.confitmText}>
                                Обновить ячейку?
                              </p>
                              {!respondedApprovals.has(
                                toRespondedApprovalStr(
                                  part.type,
                                  part.approval.id,
                                ),
                              ) && (
                                <div className={styles.btnGroup}>
                                  <button
                                    className={clsx(styles.btn, styles.confirm)}
                                    onClick={onConfirmApprovalClick(
                                      part.approval.id,
                                    )}
                                  >
                                    Да
                                  </button>
                                  <button
                                    className={clsx(styles.btn, styles.deny)}
                                    onClick={onDenyApprovalClick(
                                      part.approval.id,
                                    )}
                                  >
                                    Нет
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        case "approval-responded":
                          return (
                            <p key={i}>
                              {part.approval.approved ? "Да" : "Нет"}
                            </p>
                          );
                        case "output-available":
                          return (
                            <div key={i} className={styles.systemMsg}>
                              Ячейка обновлена
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
          onSubmit={onMessagegSubmit}
          className={styles.inputFormContainer}
          style={getHighlightStyle(HighlightSections.input)}
        >
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={onMessagegSubmit}
            placeholder="Введите сообщение..."
          />
          <div className={styles.inputHelpersContainer}>
            <button
              className={styles.submitBtn}
              type="submit"
              disabled={!isSendMsgAvailable}
            >
              <SendMsgIcon />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
