import { HttpChatTransportInitOptions, UIMessage } from "ai";

export type TransportFetchType = NonNullable<
  HttpChatTransportInitOptions<UIMessage>["fetch"]
>;
