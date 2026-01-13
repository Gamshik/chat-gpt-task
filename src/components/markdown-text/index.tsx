import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownTextType } from "./types";
import { IMarkdownTextProps } from "./interfaces";

export const MarkdownText: MarkdownTextType = ({
  text,
}: IMarkdownTextProps) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
);
