import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decodeVin, normalizeVin } from "@/lib/vin";
import { cn } from "@/lib/utils";

export function VinForm({
  size = "lg",
  initial = "",
  autoFocus = false,
}: {
  size?: "sm" | "lg";
  initial?: string;
  autoFocus?: boolean;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const decoded = useMemo(() => decodeVin(value), [value]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const vin = normalizeVin(value);
    const raw = value.trim();
    if (vin.length === 17) {
      void navigate({ to: "/vin/$vin", params: { vin } });
      return;
    }
    if (raw) {
      void navigate({ to: "/search", search: { q: raw } });
    }
  }

  const empty = decoded.vin.length === 0;
  const hint = empty
    ? size === "lg"
      ? "17-character VIN, or an OEM number"
      : ""
    : decoded.validLength
      ? decoded.checkDigitOk === false
        ? "Check digit does not match. This is not a resolved vehicle."
        : "Check digit matches. Identity is resolved from the sale sheet or NHTSA, not this box."
      : `${decoded.vin.length}/17`;

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-surface p-1.5 shadow-[var(--shadow-border)]",
          size === "sm" && "rounded-md p-1",
        )}
      >
        <Input
          name="q"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder={size === "lg" ? "Enter a VIN" : "VIN or OEM"}
          aria-label="VIN or OEM number"
          className={cn(
            "border-0 bg-transparent shadow-none font-mono tracking-wider",
            size === "lg" ? "h-12 text-base" : "h-9 text-sm",
          )}
        />
        <Button type="submit" size={size === "lg" ? "lg" : "sm"} className="shrink-0">
          <Search className="size-4" />
          {size === "lg" ? "Search" : "Go"}
        </Button>
      </div>
      {hint ? <p className="mt-2 font-mono text-xs text-subtle">{hint}</p> : null}
    </form>
  );
}
