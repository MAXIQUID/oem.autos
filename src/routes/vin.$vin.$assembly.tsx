import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vin/$vin/$assembly")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
