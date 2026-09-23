export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  channelId?: string;
}

export interface PushResult {
  success: boolean;
  error?: string;
  isInvalidToken?: boolean;
}

export interface PushProvider {
  sendPush(message: PushMessage): Promise<PushResult>;
  sendBatch(messages: PushMessage[]): Promise<PushResult[]>;
}

export const PUSH_PROVIDER = 'PUSH_PROVIDER';
