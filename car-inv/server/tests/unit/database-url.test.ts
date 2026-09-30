import { describe, expect, it } from 'vitest';

import { buildDatabaseUrl } from '../../src/config/database-url.js';
import { parseEnvironment } from '../../src/config/env.js';

describe('buildDatabaseUrl', () => {
  it('builds a MySQL URL from discrete environment fields', () => {
    const environment = parseEnvironment({
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USERNAME: 'root',
      DB_PASSWORD: 'secret',
      DB_NAME: 'car_dealership',
    });

    expect(buildDatabaseUrl(environment)).toBe('mysql://root:secret@localhost:3306/car_dealership');
  });

  it('percent-encodes credentials and database names', () => {
    const environment = parseEnvironment({
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USERNAME: 'app@user',
      DB_PASSWORD: "p@ss:/?#[]!'()*",
      DB_NAME: 'car dealership',
    });

    expect(buildDatabaseUrl(environment)).toBe(
      'mysql://app%40user:p%40ss%3A%2F%3F%23%5B%5D%21%27%28%29%2A@localhost:3306/car%20dealership',
    );
  });

  it('formats an IPv6 host correctly', () => {
    const environment = parseEnvironment({
      DB_HOST: '::1',
      DB_PORT: '3306',
      DB_USERNAME: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'car_dealership',
    });

    expect(buildDatabaseUrl(environment)).toBe('mysql://root:@[::1]:3306/car_dealership');
  });
});
