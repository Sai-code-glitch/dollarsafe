import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";

/** Earlier turns are replayed as plain text only, so no thinking blocks from past turns are ever re-sent. */
export function toHistory(messages: { role: "USER" | "ASSISTANT"; content: string }[]): Beta.BetaMessageParam[] {
  const out: Beta.BetaMessageParam[] = [];
  for (const m of messages) {
    const role = m.role === "USER" ? "user" : "assistant";
    const prev = out[out.length - 1];
    if (prev && prev.role === role) {
      prev.content = `${prev.content as string}\n\n${m.content}`;
    } else {
      out.push({ role, content: m.content });
    }
  }
  while (out.length && out[0].role !== "user") out.shift();
  // The new user turn is appended by the caller, so history must end with the assistant.
  if (out.length && out[out.length - 1].role === "user") out.pop();
  return out;
}
