import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IMarkdownTextProps } from "./interfaces";

export const MarkdownText = ({ text }: IMarkdownTextProps) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
);
