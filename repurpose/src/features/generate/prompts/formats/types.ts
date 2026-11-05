import type { z } from "zod";

import type { Format, OutputContent } from "@/types";

/** Thrown by finalize() when the model's output is structurally valid but unusable. Triggers one retry. */
export class FormatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormatValidationError";
  }
}

export type FormatModule = {
  format: Format;
  kind: OutputContent["kind"];
  schemaName: string;
  /** What the MODEL produces (the raw shape). Not the stored shape. */
  schema: z.ZodType;
  /** Platform rules. Must start with the `### Format key:` marker line (mock fixtures key on it). */
  instructions: string;
  /** Validates + post-processes raw model output into the stored OutputContent. */
  finalize: (raw: unknown) => OutputContent;
};

type FormatDef<Raw> = Omit<FormatModule, "schema" | "finalize"> & {
  schema: z.ZodType<Raw>;
  finalize: (raw: Raw) => OutputContent;
};

/** Keeps per-format code fully typed while the registry stays uniform. */
export function defineFormat<Raw>(def: FormatDef<Raw>): FormatModule {
  const schema: z.ZodType = def.schema;
  return {
    ...def,
    schema,
    finalize: (raw) => def.finalize(def.schema.parse(raw)),
  };
}
