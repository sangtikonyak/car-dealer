import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SnackbarProvider, useSnackbar } from './Snackbar';

afterEach(cleanup);

function Trigger() {
  const { showSnackbar } = useSnackbar();
  return (
    <div>
      <button
        type="button"
        onClick={() => showSnackbar({ message: 'Vehicle saved successfully', tone: 'success' })}
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => showSnackbar({ message: 'Vehicle could not be saved.', tone: 'error' })}
      >
        Fail
      </button>
    </div>
  );
}

describe('global snackbar', () => {
  it('shows a success message and can be dismissed', () => {
    render(
      <SnackbarProvider>
        <Trigger />
      </SnackbarProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('status')).toHaveTextContent('Vehicle saved successfully');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders failures as assertive alerts', () => {
    render(
      <SnackbarProvider>
        <Trigger />
      </SnackbarProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fail' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Vehicle could not be saved.');
  });
});
