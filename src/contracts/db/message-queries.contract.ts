import { IMessageModel, ICreateMessageDTO } from "@models";

export interface IMessageQueries {
  create(dto: ICreateMessageDTO): string;
  getByThreadId(threadId: string): IMessageModel[];
}
