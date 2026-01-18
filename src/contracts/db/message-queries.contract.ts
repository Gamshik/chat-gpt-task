import { ICreateMessageDTO } from "@dto";
import { IMessageModel } from "@models";

export interface IMessageQueries {
  create(dto: ICreateMessageDTO): string;
  getByThreadId(threadId: string): IMessageModel[];
}
