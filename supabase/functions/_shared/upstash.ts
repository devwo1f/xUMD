import { getEnv } from './env.ts';
import { HttpError } from './errors.ts';

type UpstashResult<T> = {
  result?: T;
  error?: string;
};

export class UpstashRedis {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private async request<T>(body: unknown, endpoint = ''): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as UpstashResult<T> | UpstashResult<T>[];
    if (!response.ok) {
      throw new HttpError(response.status, 'upstream_error', 'Upstash request failed.', payload);
    }

    if (!Array.isArray(payload) && payload.error) {
      throw new HttpError(502, 'upstream_error', payload.error);
    }

    return payload as T;
  }

  async command<T>(command: string, ...args: Array<string | number>) {
    const payload = await this.request<UpstashResult<T>>([command.toUpperCase(), ...args]);
    if (payload.error) {
      throw new HttpError(502, 'upstream_error', payload.error);
    }
    return payload.result as T;
  }

  async pipeline<T = unknown>(commands: Array<Array<string | number>>) {
    return this.request<Array<UpstashResult<T>>>(commands, '/pipeline');
  }

  async getJson<T>(key: string) {
    const value = await this.command<string | null>('GET', key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number) {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.command('SET', key, serialized, 'EX', ttlSeconds);
      return;
    }

    await this.command('SET', key, serialized);
  }

  async del(key: string) {
    await this.command('DEL', key);
  }

  async sadd(key: string, ...members: string[]) {
    if (members.length === 0) {
      return 0;
    }

    return this.command<number>('SADD', key, ...members);
  }

  async smembers(key: string) {
    return this.command<string[]>('SMEMBERS', key);
  }

  async expire(key: string, ttlSeconds: number) {
    await this.command('EXPIRE', key, ttlSeconds);
  }

  async zadd(key: string, entries: Array<{ score: number; member: string }>) {
    if (entries.length === 0) {
      return 0;
    }

    const args = entries.flatMap((entry) => [entry.score, entry.member]);
    return this.command<number>('ZADD', key, ...args);
  }

  async zrevrangeWithScores(key: string, start: number, stop: number) {
    const result = await this.command<string[]>('ZREVRANGE', key, start, stop, 'WITHSCORES');
    const pairs: Array<{ member: string; score: number }> = [];

    for (let index = 0; index < result.length; index += 2) {
      pairs.push({
        member: result[index],
        score: Number(result[index + 1] ?? 0),
      });
    }

    return pairs;
  }
}

export function getRedis() {
  const env = getEnv();
  if (!env.upstashRedisRestUrl || !env.upstashRedisRestToken) {
    return null;
  }

  return new UpstashRedis(
    env.upstashRedisRestUrl.replace(/\/$/, ''),
    env.upstashRedisRestToken,
  );
}