import { StreamEventSchema, type StreamEvent } from "./schema";

/** One SSE frame per event. */
export function encodeEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function decodeEventData(data: string): StreamEvent | null {
  try {
    const parsed = StreamEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Reads an SSE response to completion, calling onEvent for each valid frame. */
export async function readSseStream(
  res: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("\n");
      if (!data) continue;
      const event = decodeEventData(data);
      if (event) onEvent(event);
    }
  }
}
