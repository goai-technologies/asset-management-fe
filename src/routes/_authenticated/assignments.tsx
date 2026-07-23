import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/assignments")({
  beforeLoad: () => {
    throw redirect({ to: "/assets" });
  },
});
