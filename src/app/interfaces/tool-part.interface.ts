interface IApprovalData {
  id: string;
  approved: boolean;
}

export interface IToolPart {
  // TODO: стейты можно выписать в тип
  state: string;
  toolCallId: string;
  type: string;
  input: unknown;
  output: unknown;
  errorText?: string;
  approval?: IApprovalData;
  providerExecuted?: boolean;
  title?: string;
}
