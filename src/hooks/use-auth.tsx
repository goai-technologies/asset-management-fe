import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "administrator" | "it_team" | "employee";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { session, user: session?.user ?? null as User | null, loading };
}

export function useRoles(userId: string | null | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setRoles([]); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data }) => {
      if (!mounted) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [userId]);

  const isAdmin = roles.includes("administrator");
  const isIt = roles.includes("it_team");
  const isEmployee = roles.includes("employee");
  const canManage = isAdmin || isIt;
  return { roles, isAdmin, isIt, isEmployee, canManage, loading };
}
