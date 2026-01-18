import { ICreateMessagePartDTO } from "@dto";

export interface IMessagePartQueries {
  create(messageId: string, part: ICreateMessagePartDTO): string;
}
