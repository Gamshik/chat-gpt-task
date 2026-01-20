import { ICreateMessageDTO } from "@dto";
import { IMessageModel } from "@models";

export interface IMessagesQueries {
  create(dto: ICreateMessageDTO): string;
  getByThreadId(threadId: string): IMessageModel[];
  getById(id: string): IMessageModel | null;
}
