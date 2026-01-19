export interface IToolPart {
  state: string;
  toolCallId: string;
  type: string;
  input: unknown;
  output: unknown;
  errorText?: string;
  providerExecuted?: boolean;
  title?: string;
}
