import { useCallback } from "react";

import actionUrls from "../config.json";

/**
 * Resolves runtime-action URLs from `config.json` (rewritten by the app builder CLI at
 * build/dev time with each action's live URL).
 */
export function useConfig() {
  const getActionUrl = useCallback(
    (action: string) => (actionUrls as Record<string, string>)[action],
    [],
  );

  return { getActionUrl };
}
