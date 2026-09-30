import type { Environment } from './env.js';

type DatabaseUrlEnvironment = Pick<
  Environment,
  'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
>;

const encodeUrlComponent = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const formatHost = (host: string): string =>
  host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;

export const buildDatabaseUrl = (environment: DatabaseUrlEnvironment): string => {
  const username = encodeUrlComponent(environment.DB_USERNAME);
  const password = encodeUrlComponent(environment.DB_PASSWORD);
  const host = formatHost(environment.DB_HOST);
  const database = encodeUrlComponent(environment.DB_NAME);

  return `mysql://${username}:${password}@${host}:${environment.DB_PORT}/${database}`;
};
