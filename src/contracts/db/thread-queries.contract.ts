import { ICreateThreadDTO, ISetActiveStreamDTO } from "@dto";
import { IThreadModel } from "@models";

// TODO: если расширять это приложение и делать прям хорошо,
// то лучше добавить слой (service) между UI и Query,
// чтобы UI работал онли с дтошками, а Query (бд слой) с моделями,
// но в данном контексте это звучит очень избыточно
export interface IThreadQueries {
  create(dto: ICreateThreadDTO): string;
  setActiveStream(dto: ISetActiveStreamDTO): void;
  getAll(): IThreadModel[];
  getById(id: string): IThreadModel | null;
  delete(id: string): void;
}
