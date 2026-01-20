import { ICreateMessagePartDTO } from "@dto";

export interface IMessagePartsQueries {
  create(messageId: string, part: ICreateMessagePartDTO): string;
}
