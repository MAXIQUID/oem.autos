import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
