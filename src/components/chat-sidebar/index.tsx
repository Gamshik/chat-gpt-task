"use client";

import styles from "./styles.module.scss";
import clsx from "clsx";
import CloseSidebarIcon from "@public/icons/toggle-sidebar.svg";
import { IChatSidebarProps } from "./interfaces";
import { useEffect, useState } from "react";

//#region types

type ContextMenuDataType = {
  x: number;
  y: number;
  threadId: string;
} | null;

//#endregion

export const ChatSidebar = ({
  threads,
  activeThreadId,
  onClose,
  onNewChat,
  onSelectThread,
}: IChatSidebarProps) => {
  // данные о контекстном меню
  const [contextMenu, setContextMenu] = useState<ContextMenuDataType>(null);

  // идентификатор треда для которого открыто контекстное меню
  const [selectedThreadBtnId, setSelectedThreadBtnId] = useState<string>("");

  /**
   * Закрывает контекстное меню
   */
  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedThreadBtnId("");
  };

  /**
   * Вставляет идентификатор в клипбоард
   */
  const handleCopyId = async () => {
    if (!contextMenu) return;

    await navigator.clipboard.writeText(contextMenu.threadId);

    closeContextMenu();
  };

  /** Обработчик открытия контекстного меню для кнопки треда */
  const onContextMenuThreadBtn =
    (threadId: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        threadId,
      });

      setSelectedThreadBtnId(threadId);
    };

  // если открыто контекстное меню, вешаем событие на документ,
  // которое при любои клике закрывает меню
  useEffect(() => {
    if (!contextMenu) return;

    document.addEventListener("click", closeContextMenu);

    return () => {
      document.removeEventListener("click", closeContextMenu);
    };
  }, [contextMenu]);

  return (
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
              (activeThreadId === t.id || selectedThreadBtnId === t.id) &&
                styles.active,
            )}
            onClick={() => onSelectThread(t.id)}
            onContextMenu={onContextMenuThreadBtn(t.id)}
          >
            {t.title}
          </button>
        ))}
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <button className={styles.itemBtn} onClick={handleCopyId}>
            Скопировать ID
          </button>
        </div>
      )}
    </div>
  );
};
