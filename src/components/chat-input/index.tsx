import { useEffect, useRef } from "react";
import styles from "./styles.module.scss";
import { IChatInputProps } from "./interfaces";

export const ChatInput = ({
  value,
  onChange,
  placeholder = "",
}: IChatInputProps) => {
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
