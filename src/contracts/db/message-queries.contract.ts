import { IMessageModel, ICreateMessageDTO } from "@/types/message";

export interface IMessageQueries {
  create(dto: ICreateMessageDTO): string;
  getByThreadId(threadId: string): IMessageModel[];
}
