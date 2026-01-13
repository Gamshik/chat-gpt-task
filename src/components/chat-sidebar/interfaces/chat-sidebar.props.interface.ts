import { IThreadModel } from "@models";
import { MouseEventHandler } from "react";

export interface IChatSidebarProps {
  threads: IThreadModel[];
  activeThreadId: string | null;
  onNewChatClick: MouseEventHandler<HTMLButtonElement>;
  onSelectThread: (threadId: string) => void | Promise<void>;
}
