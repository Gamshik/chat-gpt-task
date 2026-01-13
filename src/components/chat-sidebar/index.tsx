import { ChatSidebarType } from "./types";
import styles from "./styles.module.scss";
import clsx from "clsx";

export const ChatSidebar: ChatSidebarType = ({
  threads,
  activeThreadId,
  onNewChatClick,
  onSelectThread,
}) => (
  <div className={styles.chatSidebarContainer}>
    <button className={styles.newChatBtn} onClick={onNewChatClick}>
      + New Chat
    </button>
    <div className={styles.threadList}>
      {threads.map((t) => (
        <button
          key={t.id}
          className={clsx(
            styles.threadBtn,
            activeThreadId === t.id ? styles.active : ""
          )}
          onClick={() => onSelectThread(t.id)}
        >
          {t.title}
        </button>
      ))}
    </div>
  </div>
);
