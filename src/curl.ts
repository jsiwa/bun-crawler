import { $ } from "bun"

type CurlConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: string | Record<string, any>;
  url: string;
  userAgent?: string;
  cookies?: string;
  proxy?: string;
  u?: string; // Proxy authentication username:password
  timeout?: number;
  followRedirects?: boolean;
  includeHeaders?: boolean;
  outputFile?: string;
};

export function curlWithProxy(config: CurlConfig) {
  try {
    return $`curl -sL \
      ${config.url} \
      ${config.method ? `-X ${config.method}` : ''} \
      ${config.userAgent ? `-A '${config.userAgent}'` : ''} \
      -x '${config.proxy}' \
      -U '${config.u}' \
      ${config.timeout ? `-m ${config.timeout}` : ''} \
      ${config.followRedirects === false ? '--max-redirs 0' : ''} \
      ${config.includeHeaders ? '-i' : ''} \
      ${config.outputFile ? `-o ${config.outputFile}` : ''} \
      ${config.cookies ? `-b '${config.cookies}'` : ''} \
      ${config.headers ? Object.entries(config.headers).map(([key, value]) => `-H '${key}: ${value}'`).join(' ') : ''} \
      ${typeof config.data === 'string' ? `-d '${config.data}'` : config.data ? `-H 'Content-Type: application/json' -d '${JSON.stringify(config.data)}'` : ''}`
  } catch (error) {
    console.error('Curl error:', error);
    throw new Error('Failed to execute curl command')
  }
}

export function curl(config: CurlConfig) {
  try {
    return $`curl -sL \
      ${config.url} \
      ${config.method ? `-X ${config.method}` : ''} \
      ${config.userAgent ? `-A '${config.userAgent}'` : ''} \
      ${config.timeout ? `-m ${config.timeout}` : ''} \
      ${config.followRedirects === false ? '--max-redirs 0' : ''} \
      ${config.includeHeaders ? '-i' : ''} \
      ${config.outputFile ? `-o ${config.outputFile}` : ''} \
      ${config.cookies ? `-b '${config.cookies}'` : ''} \
      ${config.headers ? Object.entries(config.headers).map(([key, value]) => `-H '${key}: ${value}'`).join(' ') : ''} \
      ${typeof config.data === 'string' ? `-d '${config.data}'` : config.data ? `-H 'Content-Type: application/json' -d '${JSON.stringify(config.data)}'` : ''}`
  } catch (error) {
    console.error('Curl error:', error);
    throw new Error('Failed to execute curl command')
  }
}