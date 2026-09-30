import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { homepageDefaults } from '../features/homepage/homepageDefaults';
import { BookingCta } from './BookingCta';

const { homepageContentMock } = vi.hoisted(() => ({ homepageContentMock: vi.fn() }));

vi.mock('../features/homepage/hooks/useHomepageContent', () => ({
  useHomepageContent: homepageContentMock,
}));

describe('BookingCta', () => {
  afterEach(cleanup);

  beforeEach(() => {
    homepageContentMock.mockReturnValue({ data: homepageDefaults });
  });

  it('uses the footer phone as the Speak with our team link', () => {
    render(<BookingCta />);

    expect(screen.getByRole('link', { name: /speak with our team/i })).toHaveAttribute(
      'href',
      'tel:+914440001020',
    );
  });

  it('keeps the link synchronized with an updated footer phone number', () => {
    homepageContentMock.mockReturnValue({
      data: {
        ...homepageDefaults,
        footer: { ...homepageDefaults.footer, phone: '+91 (44) 5555 1234' },
      },
    });

    render(<BookingCta />);

    expect(screen.getByRole('link', { name: /speak with our team/i })).toHaveAttribute(
      'href',
      'tel:+914455551234',
    );
  });
});
