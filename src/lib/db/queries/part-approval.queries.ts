import { IPartApprovalQueries } from "@contracts";
import chatDb from "../database";
import { ICreatePartAprovalDTO } from "@dto";

export const partApprovalQueries: IPartApprovalQueries = {
  create: (partId: string, approval: ICreatePartAprovalDTO): string => {
    const approvalRowId = crypto.randomUUID();

    chatDb
      .prepare(
        `
        INSERT INTO parts_approvals
          (id, partId, approvalId, isApproved)
        VALUES (?, ?, ?, ?)
        `,
      )
      .run(
        approvalRowId,
        partId,
        approval.approvalId,
        approval.isApproved === null ? null : Number(approval.isApproved),
      );

    return approvalRowId;
  },
};
