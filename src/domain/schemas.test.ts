import { describe, expect, it } from 'vitest';
import { authSessionSchema, transactionSchema } from '@domain/schemas';

describe('domain schemas', () => {
  it('parses auth session payload', () => {
    const parsed = authSessionSchema.parse({
      accessToken: 'abc',
      refreshToken: 'def',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: 12,
        email: 'user@example.com',
      },
    });

    expect(parsed.user.email).toBe('user@example.com');
  });

  it('rejects invalid transaction payload', () => {
    expect(() =>
      transactionSchema.parse({
        id: 1,
        accountId: 2,
        postedAt: '2026-02-06T00:00:00Z',
        amount: 'not-a-number',
      }),
    ).toThrow();
  });
});
