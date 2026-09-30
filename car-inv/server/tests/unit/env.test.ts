import { describe, expect, it } from 'vitest';

import { parseEnvironment } from '../../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '8000',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USERNAME: 'root',
  DB_PASSWORD: 'secret',
  DB_NAME: 'car_dealership',
};

describe('parseEnvironment', () => {
  it('parses valid database configuration', () => {
    expect(parseEnvironment(validEnvironment)).toMatchObject({
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USERNAME: 'root',
      DB_NAME: 'car_dealership',
    });
  });

  it('accepts an empty password for local MySQL installations configured that way', () => {
    expect(parseEnvironment({ ...validEnvironment, DB_PASSWORD: '' }).DB_PASSWORD).toBe('');
  });

  it('rejects missing required database configuration', () => {
    const incompleteEnvironment = Object.fromEntries(
      Object.entries(validEnvironment).filter(([key]) => key !== 'DB_HOST'),
    );

    expect(() => parseEnvironment(incompleteEnvironment)).toThrow();
  });

  it('rejects ports outside the TCP port range', () => {
    expect(() => parseEnvironment({ ...validEnvironment, DB_PORT: '70000' })).toThrow();
  });

  it('rejects hosts containing protocols or paths', () => {
    expect(() =>
      parseEnvironment({ ...validEnvironment, DB_HOST: 'mysql://localhost/database' }),
    ).toThrow();
  });
});
