import { AxiosError, AxiosHeaders, create, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

type Reply = [status: number, data?: unknown];

/** An axios instance answered by a function: no network, no mocking library. */
export function fakeHttp(handler: (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>) {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const [status, data] = await handler(config);
    const response = { status, statusText: '', headers: new AxiosHeaders(), config, data };
    if (status >= 400) throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, null, response);
    return response;
  };
  return { http: create({ adapter, baseURL: 'https://api.test/' }), calls };
}

export const bearer = (c: InternalAxiosRequestConfig) => String(c.headers.get('Authorization') ?? '');
