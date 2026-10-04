import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminBrandLockup } from './AdminBrandLockup';

afterEach(cleanup);

describe('AdminBrandLockup', () => {
  it('shows the configured text mark and brand name', () => {
    render(<AdminBrandLockup brandName="Northstar Motors" brandMark="N" suffix="control room" />);

    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('Northstar Motors control room')).toBeInTheDocument();
  });

  it('can hide the name when rendered in a collapsed sidebar', () => {
    render(<AdminBrandLockup brandName="Northstar Motors" brandMark="N" showName={false} />);

    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.queryByText('Northstar Motors')).not.toBeInTheDocument();
  });

  it('shows an uploaded image logo and falls back to the brand initial if it fails', () => {
    const { container } = render(
      <AdminBrandLockup brandName="Northstar Motors" brandMark="https://cdn.example/logo.png" />,
    );
    const logo = container.querySelector('img');

    expect(logo).toHaveAttribute('src', 'https://cdn.example/logo.png');
    fireEvent.error(logo!);

    expect(screen.getByText('N')).toBeInTheDocument();
  });
});
