import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/part/$oem")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
