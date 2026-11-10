import { useEffect } from 'react';

/**
 * Runs `loader` on mount and whenever its identity changes (i.e. when the deps of the
 * `useCallback` that produced it change).
 *
 * The call is deferred to a microtask so the loader's synchronous `setLoading(true)` is not
 * executed inside the effect body (see react-hooks/set-state-in-effect), and it is cancelled
 * on unmount — which also prevents the duplicate request React StrictMode would otherwise fire.
 */
export function useLoadOnChange(loader) {
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loader();
    });
    return () => {
      cancelled = true;
    };
  }, [loader]);
}
