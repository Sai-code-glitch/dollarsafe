import { describe, expect, it } from "vitest";
import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { REFUSAL_TEXT, runAdvisor, type ModelClient, type ModelTurnRequest } from "@/lib/advisor/agent";
import { MockModelClient } from "@/lib/advisor/mock";
import { toHistory } from "@/lib/advisor/history";

const usage = { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
const msg = (content: unknown[], stop_reason: string) => ({ id: "m", type: "message", role: "assistant", model: "test-model", content, stop_reason, stop_sequence: null, usage }) as unknown as Beta.BetaMessage;

class ScriptedClient implements ModelClient {
  readonly model = "test-model";
  requests: ModelTurnRequest[] = [];
  constructor(private script: Beta.BetaMessage[]) {}
  async runTurn(req: ModelTurnRequest, onText: (d: string) => void) {
    this.requests.push(structuredClone(req));
    const next = this.script.shift()!;
    for (const b of next.content) if (b.type === "text") onText(b.text);
    return next;
  }
}

const system: Beta.BetaTextBlockParam[] = [{ type: "text", text: "policy" }];

describe("runAdvisor", () => {
  it("runs a tool, feeds back the result and returns the final answer", async () => {
    const client = new ScriptedClient([
      msg(
        [
          { type: "text", text: "Let me check." },
          { type: "tool_use", id: "t1", name: "loan_payment", input: { principal: 12000, aprPct: 0, years: 1 } },
        ],
        "tool_use",
      ),
      msg([{ type: "text", text: "Your payment is $1,000 a month." }], "end_turn"),
    ]);
    const events: string[] = [];
    const result = await runAdvisor({ client, system, history: [], userContent: [{ type: "text", text: "loan?" }], effort: "low", onEvent: (e) => events.push(e.type) });

    expect(result.text).toBe("Let me check.\n\nYour payment is $1,000 a month.");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0]).toMatchObject({ name: "loan_payment", ok: true, output: { monthlyPayment: 1000 } });
    expect(result.inputTokens).toBe(20);
    // Second request appends the assistant turn unchanged, then the tool result.
    const second = client.requests[1].messages;
    expect(second).toHaveLength(3);
    expect(second[1].role).toBe("assistant");
    const toolResult = (second[2].content as Beta.BetaToolResultBlockParam[])[0];
    expect(toolResult).toMatchObject({ type: "tool_result", tool_use_id: "t1", is_error: false });
    expect(events).toContain("tool");
  });

  it("returns tool validation errors to the model instead of throwing", async () => {
    const client = new ScriptedClient([
      msg([{ type: "tool_use", id: "t1", name: "loan_payment", input: { principal: -5, aprPct: 5, years: 1 } }], "tool_use"),
      msg([{ type: "text", text: "Could you share the loan amount?" }], "end_turn"),
    ]);
    const result = await runAdvisor({ client, system, history: [], userContent: [{ type: "text", text: "x" }], effort: "low", onEvent: () => undefined });
    expect(result.toolCalls[0].ok).toBe(false);
    const toolResult = (client.requests[1].messages[2].content as Beta.BetaToolResultBlockParam[])[0];
    expect(toolResult.is_error).toBe(true);
  });

  it("replaces a refusal with a safe message", async () => {
    const client = new ScriptedClient([msg([], "refusal")]);
    const result = await runAdvisor({ client, system, history: [], userContent: [{ type: "text", text: "x" }], effort: "low", onEvent: () => undefined });
    expect(result.text).toBe(REFUSAL_TEXT);
  });

  it("forbids tools on the last iteration so the loop always ends", async () => {
    const loop = Array.from({ length: 6 }, (_, i) => msg([{ type: "tool_use", id: `t${i}`, name: "loan_payment", input: { principal: 1000, aprPct: 5, years: 1 } }], "tool_use"));
    const client = new ScriptedClient(loop);
    await runAdvisor({ client, system, history: [], userContent: [{ type: "text", text: "x" }], effort: "low", onEvent: () => undefined });
    expect(client.requests).toHaveLength(6);
    expect(client.requests[5].forbidTools).toBe(true);
    expect(client.requests[4].forbidTools).toBe(false);
  });

  it("works end to end with the offline mock model", async () => {
    const result = await runAdvisor({
      client: new MockModelClient(),
      system: [{ type: "text", text: "Age: about 30" }],
      history: [],
      userContent: [{ type: "text", text: "How fast can I pay off my credit card debt?" }],
      effort: "low",
      onEvent: () => undefined,
    });
    expect(result.toolCalls[0].name).toBe("debt_payoff_plan");
    expect(result.text).toContain("Demo mode");
  });
});

describe("toHistory", () => {
  it("merges same-role runs and trims to a user-first, assistant-last history", () => {
    const h = toHistory([
      { role: "ASSISTANT", content: "orphan" },
      { role: "USER", content: "a" },
      { role: "USER", content: "b" },
      { role: "ASSISTANT", content: "c" },
      { role: "USER", content: "unanswered" },
    ]);
    expect(h).toEqual([
      { role: "user", content: "a\n\nb" },
      { role: "assistant", content: "c" },
    ]);
  });
});
