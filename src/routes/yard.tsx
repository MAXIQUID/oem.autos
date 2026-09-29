import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/yard")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
