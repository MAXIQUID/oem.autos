import { useEffect, useState } from "react";
import { getMakes, getModels, getYears } from "@/lib/vehicles/queries";

type Props = {
  year: number | null;
  make: string | null;
  model: string | null;
  initialYears?: number[];
  onYear: (year: number) => void;
  onMake: (make: string) => void;
  onModel: (model: string) => void | Promise<void>;
};

const field =
  "h-12 w-full rounded-md bg-surface-2 px-3 text-fg shadow-[var(--shadow-border)] outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function VehicleBrowser(props: Props) {
  const [years, setYears] = useState<number[]>(props.initialYears ?? []);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState<"years" | "makes" | "models" | "open" | null>(
    props.initialYears?.length ? null : "years",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (years.length > 0) return;
    let cancel = false;
    setLoading("years");
    getYears()
      .then((next) => {
        if (!cancel) setYears(next);
      })
      .catch(() => {
        if (!cancel) setError("Vehicle years are unavailable.");
      })
      .finally(() => {
        if (!cancel) setLoading((cur) => (cur === "years" ? null : cur));
      });
    return () => {
      cancel = true;
    };
  }, [years.length]);

  useEffect(() => {
    if (!props.year) {
      setMakes([]);
      return;
    }
    let cancel = false;
    setLoading("makes");
    setMakes([]);
    getMakes({ data: { year: props.year } })
      .then((next) => {
        if (!cancel) setMakes(next);
      })
      .catch(() => {
        if (!cancel) setError("Makes are unavailable for that year.");
      })
      .finally(() => {
        if (!cancel) setLoading((cur) => (cur === "makes" ? null : cur));
      });
    return () => {
      cancel = true;
    };
  }, [props.year]);

  useEffect(() => {
    if (!props.year || !props.make) {
      setModels([]);
      return;
    }
    let cancel = false;
    setLoading("models");
    setModels([]);
    getModels({ data: { year: props.year, make: props.make } })
      .then((next) => {
        if (!cancel) setModels(next);
      })
      .catch(() => {
        if (!cancel) setError("Models are unavailable.");
      })
      .finally(() => {
        if (!cancel) setLoading((cur) => (cur === "models" ? null : cur));
      });
    return () => {
      cancel = true;
    };
  }, [props.year, props.make]);

  const yearOptions = props.year && !years.includes(props.year) ? [props.year, ...years] : years;
  const makeOptions = props.make && !makes.includes(props.make) ? [props.make, ...makes] : makes;
  const modelOptions = props.model && !models.includes(props.model) ? [props.model, ...models] : models;

  async function chooseModel(model: string) {
    if (!model) return;
    setError(null);
    setLoading("open");
    try {
      await props.onModel(model);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that model.");
    } finally {
      setLoading((cur) => (cur === "open" ? null : cur));
    }
  }

  return (
    <div className="border-b border-border">
      <form
        className="mx-auto grid max-w-6xl gap-3 px-4 py-4 sm:grid-cols-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-subtle">
          Year
          <select
            className={field}
            value={props.year ?? ""}
            disabled={loading === "years" && years.length === 0}
            onChange={(e) => {
              setError(null);
              const next = Number(e.target.value);
              if (next) props.onYear(next);
            }}
          >
            <option value="">{loading === "years" ? "Loading years" : "Select year"}</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-subtle">
          Make
          <select
            className={field}
            value={props.make ?? ""}
            disabled={!props.year || loading === "makes"}
            onChange={(e) => {
              setError(null);
              if (e.target.value) props.onMake(e.target.value);
            }}
          >
            <option value="">
              {!props.year ? "Select year first" : loading === "makes" ? "Loading makes" : "Select make"}
            </option>
            {makeOptions.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-subtle">
          Model
          <select
            className={field}
            value={props.model ?? ""}
            disabled={!props.make || loading === "models" || loading === "open"}
            onChange={(e) => {
              void chooseModel(e.target.value);
            }}
          >
            <option value="">
              {!props.make ? "Select make first" : loading === "models" ? "Loading models" : "Select model"}
            </option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm normal-case tracking-normal text-danger sm:col-span-3">{error}</p> : null}
      </form>
    </div>
  );
}
