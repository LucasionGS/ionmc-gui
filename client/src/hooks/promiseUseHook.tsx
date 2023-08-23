import React from "react";

/**
 * Converts a promise to a hook. 
 */
export default function promiseUseHook<T, const TArgs extends any[]>(fn: (...args: TArgs) => PromiseLike<T>) {
  return function useHook(...args: TArgs) {
    const [state, setState] = React.useState<T | null>(null);
    const refresh = (...args: TArgs) => {
      fn(...args).then(setState);
    }
    React.useEffect(() => {
      refresh(...args);
    }, []);
    return [state, refresh] as const;
  }
}