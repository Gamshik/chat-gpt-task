import { IThreadModel, ICreateThreadDTO } from "@models";

export interface IThreadQueries {
  create(dto: ICreateThreadDTO): string;
  getAll(): IThreadModel[];
  getById(id: string): IThreadModel | null;
  delete(id: string): void;
}
