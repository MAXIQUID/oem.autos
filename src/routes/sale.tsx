import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  make: z.string().optional(),
  state: z.string().optional(),
  runs: z.string().optional(),
  page: z.union([z.string(), z.number()]).optional(),
});

export const Route = createFileRoute("/sale")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    throw redirect({ to: "/vehicles" });
  },
  component: () => null,
});
