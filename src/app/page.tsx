"use client";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useState, useEffect, FormEvent, useRef } from "react";
import SendMsgIcon from "@public/icons/send-msg.svg";

import styles from "./page.module.scss";
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
import { useSearchParams, useRouter } from "next/navigation";
import {
  HighlightSectionType,
  IHighlightSectionData,
  IShowStockPriceResult,
} from "@app/interfaces";

type TransportFetch = NonNullable<
  HttpChatTransportInitOptions<UIMessage>["fetch"]
>;

export default function Page() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [threads, setThreads] = useState<IThreadModel[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const [highlight, setHighlight] = useState<IHighlightSectionData | null>(
    null
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const threadIdFromQuery = searchParams.get("thread");
    if (threadIdFromQuery && threadIdFromQuery !== activeThreadId) {
      setActiveThreadId(threadIdFromQuery);
      loadThreadMessages(threadIdFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (activeThreadId) {
      params.set("thread", activeThreadId);
    } else {
      params.delete("thread");
    }

    router.replace(`${window.location.pathname}?${params.toString()}`);
  }, [activeThreadId, router]);

  useEffect(() => {
    if (highlight) {
      const timer = setTimeout(() => setHighlight(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

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
        body: { messages, threadId: activeThreadId },
      }),
      fetch: (async (input: string | URL | Request, init?: RequestInit) => {
        const response = await fetch(input, init);
        const serverThreadId = response.headers.get("x-thread-id");

        if (serverThreadId && !activeThreadId) {
          queueMicrotask(() => {
            setActiveThreadId(serverThreadId);
            fetchThreads();
            loadThreadMessages(serverThreadId);
          });
        }
        return response;
      }) as TransportFetch,
    }),
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;

      if (toolCall.toolName === "highlightSection") {
        const args = toolCall.input as IHighlightSectionData;

        setHighlight({ section: args.section, color: args.color });

        addToolOutput({
          tool: "highlightSection",
          toolCallId: toolCall.toolCallId,
          output: "Successfully highlighted",
        });
      }
    },
  });

  const getHighlightStyle = (sectionName: HighlightSectionType) => {
    if (highlight?.section === sectionName) {
      return {
        boxShadow: `0 0 0 4px ${highlight.color}`,
        transition: "all 0.3s ease-in-out",
      };
    }
    return {};
  };

  const fetchThreads = async () => {
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
    sendMessage({ text: inputValue });
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
      <aside style={getHighlightStyle("sidebar")}>
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onNewChatClick={handleNewChat}
          onSelectThread={loadThreadMessages}
        />
      </aside>

      <main className={styles.chatArea} style={getHighlightStyle("chat")}>
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
          style={getHighlightStyle("input")}
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
