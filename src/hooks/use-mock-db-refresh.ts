import { useEffect, useState } from "react";

export const MOCK_DB_CHANGED = "eams:mock-db-changed";

/** Bump local state when MockDB writes so lists, stats, and charts stay in sync. */
export function useMockDbRefresh() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(MOCK_DB_CHANGED, onChange);
    return () => window.removeEventListener(MOCK_DB_CHANGED, onChange);
  }, []);

  return { tick, refresh: () => setTick((t) => t + 1) };
}
