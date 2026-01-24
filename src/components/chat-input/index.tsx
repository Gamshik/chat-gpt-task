import { useEffect, useRef } from "react";
import styles from "./styles.module.scss";
import { IChatInputProps } from "./interfaces";

export const ChatInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = "",
}: IChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Ресайзит textarea при вводе
   */
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  /**
   * Отлавливает энтер и отправляем форму
   */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [value]);

  return (
    <div className={styles.chatInputContainer}>
      <textarea
        ref={textareaRef}
        className={styles.chatInput}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={1}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};
