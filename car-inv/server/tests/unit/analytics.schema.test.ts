import { describe, expect, it } from 'vitest';
import { analyticsEventSchema } from '../../src/modules/analytics/analytics.schema.js';

const validEvent = {
  eventType: 'INVENTORY_SEARCHED' as const,
  visitorId: 'visitor-123456789',
  sessionId: 'session-123456789',
  route: '/inventory',
  searchTerm: 'camry',
  resultCount: 2,
};

describe('analyticsEventSchema', () => {
  it('accepts a valid event', () => {
    expect(analyticsEventSchema.parse(validEvent)).toMatchObject(validEvent);
  });

  it('rejects unknown fields and invalid identifiers', () => {
    expect(() => analyticsEventSchema.parse({ ...validEvent, unexpected: true })).toThrow();
    expect(() => analyticsEventSchema.parse({ ...validEvent, visitorId: 'short' })).toThrow();
  });

  it('rejects negative or oversized result counts', () => {
    expect(() => analyticsEventSchema.parse({ ...validEvent, resultCount: -1 })).toThrow();
    expect(() => analyticsEventSchema.parse({ ...validEvent, resultCount: 10_001 })).toThrow();
  });
});
