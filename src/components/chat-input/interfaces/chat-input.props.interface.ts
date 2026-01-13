import { ChangeEvent } from "react";

export interface IChatInputProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void | Promise<void>;
  placeholder?: string;
}
