import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/api/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const session = await getSession();
    if (session) throw redirect({ to: "/dashboard" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
