import styles from "./styles.module.scss";
import clsx from "clsx";
import CloseSidebarIcon from "@public/icons/toggle-sidebar.svg";
import { IChatSidebarProps } from "./interfaces";

export const ChatSidebar = ({
  threads,
  activeThreadId,
  onClose,
  onNewChat,
  onSelectThread,
}: IChatSidebarProps) => (
  <div className={styles.chatSidebarContainer}>
    <div className={styles.headerContainer}>
      <button className={styles.newChatBtn} onClick={onNewChat}>
        + Новый чат
      </button>
      <button className={styles.closeSidebarBtn} onClick={onClose}>
        <CloseSidebarIcon />
      </button>
    </div>
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
