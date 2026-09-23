import { Injectable, Logger } from '@nestjs/common';
import { PushMessage, PushProvider, PushResult } from './push-provider.interface';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TIMEOUT_MS = 5000;

@Injectable()
export class ExpoPushProvider implements PushProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);

  async sendPush(message: PushMessage): Promise<PushResult> {
    const results = await this.sendBatch([message]);
    return results[0] || { success: false, error: 'No response from push service' };
  }

  async sendBatch(messages: PushMessage[]): Promise<PushResult[]> {
    if (!messages || messages.length === 0) {
      return [];
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    };

    if (process.env.EXPO_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const payload = messages.map((m) => ({
      to: m.to,
      title: m.title,
      body: m.body,
      data: m.data || {},
      sound: m.sound || 'default',
      channelId: m.channelId || 'ride-updates',
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`Expo push service error HTTP ${response.status}: ${text}`);
        return messages.map(() => ({
          success: false,
          error: `HTTP ${response.status}: ${text}`,
        }));
      }

      const json: any = await response.json();
      const ticketData = Array.isArray(json?.data) ? json.data : [json?.data];

      return ticketData.map((ticket: any, idx: number) => {
        if (ticket?.status === 'ok') {
          return { success: true };
        }

        const errCode = ticket?.details?.error;
        const errMsg = ticket?.message || errCode || 'Push ticket error';
        const isInvalidToken =
          errCode === 'DeviceNotRegistered' ||
          errCode === 'InvalidCredentials' ||
          errMsg.includes('not a valid Expo push token');

        this.logger.warn(
          `Expo push delivery issue for message ${idx}: ${errMsg} (invalidToken=${isInvalidToken})`,
        );

        return {
          success: false,
          error: errMsg,
          isInvalidToken,
        };
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError';
      const msg = isTimeout ? 'Expo push request timed out' : err?.message || 'Network error';
      this.logger.warn(`Failed to dispatch push notifications: ${msg}`);
      return messages.map(() => ({
        success: false,
        error: msg,
      }));
    }
  }
}
