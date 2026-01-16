import { IThreadModel } from "@models";

export interface IChatSidebarProps {
  threads: IThreadModel[];
  activeThreadId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void | Promise<void>;
}
