import { ICreatePartAprovalDTO } from "@dto";

export interface IPartApprovalQueries {
  create(partId: string, approval: ICreatePartAprovalDTO): string;
}
