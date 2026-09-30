import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { queryClient } from '../lib/queryClient';
import { SnackbarProvider } from '../components/Snackbar';
import { AppErrorBoundary } from './AppErrorBoundary';

export function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
