import { useEffect, useState } from "react";
import { getRoles, getSession, onAuthChanged } from "@/lib/api/auth";
import type { AppRole, AuthSession, AuthUser } from "@/lib/api/auth-types";

export type { AppRole, AuthUser };

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const next = await getSession();
      if (!mounted) return;
      setSession(next);
      setLoading(false);
    };

    void load();
    const unsubscribe = onAuthChanged(() => {
      void load();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useRoles(userId: string | null | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getRoles(userId).then((loaded) => {
      if (!mounted) return;
      if (loaded.length === 0 && import.meta.env.DEV) {
        setRoles(["administrator"]);
      } else {
        setRoles(loaded);
      }
      setLoading(false);
    });

    const unsubscribe = onAuthChanged(() => {
      void getRoles(userId).then((loaded) => {
        if (!mounted) return;
        setRoles(loaded.length === 0 && import.meta.env.DEV ? ["administrator"] : loaded);
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  const isAdmin = roles.includes("administrator");
  const isIt = roles.includes("it_team");
  const isEmployee = roles.includes("employee");
  const canManage = isAdmin || isIt || isEmployee;
  return { roles, isAdmin, isIt, isEmployee, canManage, loading };
}
