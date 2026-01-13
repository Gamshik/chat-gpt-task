import { useEffect, useRef } from "react";
import { ChatInputType } from "./types";
import styles from "./styles.module.scss";

export const ChatInput: ChatInputType = ({
  value,
  onChange,
  placeholder = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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
      />
    </div>
  );
};
