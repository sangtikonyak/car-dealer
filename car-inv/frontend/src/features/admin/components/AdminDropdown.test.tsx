import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminDropdown } from './AdminDropdown';

const options = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

describe('AdminDropdown', () => {
  afterEach(() => cleanup());

  it('opens, exposes the selected option, and changes value from the menu', () => {
    const onChange = vi.fn();
    render(
      <AdminDropdown
        label="Status"
        value="new"
        options={options}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(screen.getByRole('listbox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'New' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('option', { name: 'Contacted' }));

    expect(onChange).toHaveBeenCalledWith('contacted');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation and escape dismissal', () => {
    const onChange = vi.fn();
    render(
      <AdminDropdown
        label="Status"
        value="new"
        options={options}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Status' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const contacted = screen.getByRole('option', { name: 'Contacted' });
    fireEvent.keyDown(contacted, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('contacted');

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
