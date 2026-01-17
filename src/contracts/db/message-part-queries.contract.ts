import { ICreateMessagePartDTO, IMessagePartModel } from "@models";

export interface IMessagePartQueries {
  create(messageId: string, part: ICreateMessagePartDTO): string;
}
