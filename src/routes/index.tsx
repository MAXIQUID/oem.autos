import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/vehicles",
      search: { q: search.q?.trim() || undefined },
    });
  },
  component: () => null,
});
