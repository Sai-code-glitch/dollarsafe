import Anthropic from "@anthropic-ai/sdk";
import { runTool, TOOL_DEFINITIONS } from "./tools";

import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";
export type Effort = "low" | "medium" | "high";

export interface ModelTurnRequest {
  system: Beta.BetaTextBlockParam[];
  messages: Beta.BetaMessageParam[];
  tools: Beta.BetaTool[];
  effort: Effort;
  maxTokens: number;
  /** Set on the last allowed iteration so the model must answer in text. */
  forbidTools?: boolean;
}

/** The single seam between the advisor and the model provider, so the loop can run against a mock. */
export interface ModelClient {
  readonly model: string;
  runTurn(req: ModelTurnRequest, onText: (delta: string) => void, signal?: AbortSignal): Promise<Beta.BetaMessage>;
}

export class ClaudeModelClient implements ModelClient {
  private client: Anthropic;
  constructor(apiKey: string, readonly model: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 3 });
  }

  async runTurn(req: ModelTurnRequest, onText: (delta: string) => void, signal?: AbortSignal) {
    const stream = this.client.beta.messages.stream(
      {
        model: this.model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: req.messages,
        tools: req.tools,
        tool_choice: req.forbidTools ? { type: "none" } : { type: "auto" },
        thinking: { type: "adaptive" },
        output_config: { effort: req.effort },
        // Caches the stable prefix (policy prompt, tools, earlier turns) automatically.
        cache_control: { type: "ephemeral" },
        // If a safety classifier declines, the API re-runs the request on Anthropic's recommended fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal },
    );
    stream.on("text", onText);
    return stream.finalMessage();
  }
}

export type AdvisorEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown; ok: boolean }
  | { type: "status"; message: string };

export interface AdvisorResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls: { name: string; input: unknown; output: unknown; ok: boolean }[];
  stopReason: string | null;
}

export const REFUSAL_TEXT =
  "I'm not able to help with that request. I'm happy to help with budgeting, saving, debt, credit, retirement accounts, taxes basics or protecting yourself from scams.";

const MAX_ITERATIONS = 6;

export async function runAdvisor(opts: {
  client: ModelClient;
  system: Beta.BetaTextBlockParam[];
  history: Beta.BetaMessageParam[];
  userContent: Beta.BetaContentBlockParam[];
  effort: Effort;
  onEvent: (e: AdvisorEvent) => void;
  signal?: AbortSignal;
}): Promise<AdvisorResult> {
  // Append-only within a turn: each response is added back unchanged (thinking blocks included).
  const messages: Beta.BetaMessageParam[] = [...opts.history, { role: "user", content: opts.userContent }];
  const result: AdvisorResult = { text: "", model: opts.client.model, inputTokens: 0, outputTokens: 0, toolCalls: [], stopReason: null };
  const emitText = (t: string) => {
    result.text += t;
    opts.onEvent({ type: "text", text: t });
  };

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (i > 0 && result.text && !result.text.endsWith("\n\n")) emitText("\n\n");
    const response = await opts.client.runTurn(
      { system: opts.system, messages, tools: TOOL_DEFINITIONS, effort: opts.effort, maxTokens: 16000, forbidTools: i === MAX_ITERATIONS - 1 },
      emitText,
      opts.signal,
    );
    result.model = response.model;
    result.inputTokens += response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0);
    result.outputTokens += response.usage.output_tokens;
    result.stopReason = response.stop_reason;

    if (response.stop_reason === "refusal") {
      emitText(REFUSAL_TEXT);
      break;
    }
    if (response.stop_reason !== "tool_use") {
      if (response.stop_reason === "max_tokens") emitText("\n\n_(Answer shortened. Ask me to continue for more.)_");
      break;
    }

    const toolResults: Beta.BetaToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      opts.onEvent({ type: "status", message: `Running ${block.name.replace(/_/g, " ")}…` });
      const outcome = runTool(block.name, block.input);
      const output = outcome.ok ? outcome.output : { error: outcome.error };
      result.toolCalls.push({ name: block.name, input: block.input, output, ok: outcome.ok });
      opts.onEvent({ type: "tool", name: block.name, input: block.input, ok: outcome.ok });
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(output), is_error: !outcome.ok });
    }
    messages.push({ role: "assistant", content: response.content as Beta.BetaContentBlockParam[] });
    messages.push({ role: "user", content: toolResults });
  }

  result.text = result.text.trim();
  return result;
}
