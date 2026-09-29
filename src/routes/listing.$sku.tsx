import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/listing/$sku")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
