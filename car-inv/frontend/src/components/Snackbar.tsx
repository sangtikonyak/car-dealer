import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type SnackbarTone = 'success' | 'error' | 'info';

export interface SnackbarOptions {
  message: string;
  tone?: SnackbarTone;
  durationMs?: number;
}

interface SnackbarState extends SnackbarOptions {
  id: number;
}

interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions | string) => void;
  dismissSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const nextId = useRef(0);

  const showSnackbar = useCallback((options: SnackbarOptions | string) => {
    const normalized = typeof options === 'string' ? { message: options } : options;
    nextId.current += 1;
    setSnackbar({ id: nextId.current, tone: 'info', durationMs: 3500, ...normalized });
  }, []);

  const dismissSnackbar = useCallback(() => setSnackbar(null), []);

  useEffect(() => {
    if (!snackbar) return undefined;
    const timer = window.setTimeout(dismissSnackbar, snackbar.durationMs ?? 3500);
    return () => window.clearTimeout(timer);
  }, [dismissSnackbar, snackbar]);

  const Icon =
    snackbar?.tone === 'success' ? CheckCircle2 : snackbar?.tone === 'error' ? CircleAlert : Info;

  return (
    <SnackbarContext.Provider value={{ showSnackbar, dismissSnackbar }}>
      {children}
      {snackbar ? (
        <div
          className={`global-snackbar is-${snackbar.tone}`}
          role={snackbar.tone === 'error' ? 'alert' : 'status'}
          aria-live={snackbar.tone === 'error' ? 'assertive' : 'polite'}
        >
          <Icon size={17} aria-hidden="true" />
          <span>{snackbar.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={dismissSnackbar}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within SnackbarProvider.');
  return context;
}
