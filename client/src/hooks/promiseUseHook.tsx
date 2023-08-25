import React from "react";

/**
 * Converts a promise to a hook. 
 */
export default function promiseUseHook<T, const TArgs extends any[]>(fn: (...args: TArgs) => PromiseLike<T>, defaultValue: T | null = null) {
  return function useHook(...args: TArgs) {
    const [state, setState] = React.useState<T | null>(defaultValue);
    const refresh = (...args: TArgs) => {
      fn(...args).then(setState);
    }
    React.useEffect(() => {
      refresh(...args);
    }, []);
    return [state, refresh, setState] as const;
  }
}