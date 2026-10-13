import type { ModelClient, ModelTurnRequest } from "./agent";

import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";

/**
 * Offline stand-in for Claude, used when ANTHROPIC_API_KEY is not set. It picks a calculator by
 * keyword, really runs it through the same tool loop, and explains the result in a fixed template,
 * so the whole product (streaming, tools, guardrails, billing limits) can be exercised locally.
 */
export class MockModelClient implements ModelClient {
  readonly model = "mock-advisor";

  async runTurn(req: ModelTurnRequest, onText: (delta: string) => void): Promise<Beta.BetaMessage> {
    const last = req.messages[req.messages.length - 1];
    const blocks = typeof last.content === "string" ? [{ type: "text", text: last.content } as Beta.BetaTextBlockParam] : last.content;
    const toolResult = blocks.find((b): b is Beta.BetaToolResultBlockParam => b.type === "tool_result");

    if (toolResult) {
      const text = explainToolResult(String(toolResult.content));
      await streamOut(text, onText);
      return message([{ type: "text", text, citations: null }], "end_turn");
    }

    const userText = blocks
      .filter((b): b is Beta.BetaTextBlockParam => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const ageMatch = req.system.map((s) => s.text).join("\n").match(/Age: about (\d+)/);
    const age = ageMatch ? Number(ageMatch[1]) : 30;
    const call = req.forbidTools ? null : pickTool(userText, age);

    if (!call) {
      const text = [
        "**Demo mode** (no AI key configured), so this is a sample answer.",
        "",
        "Here's a solid starting framework for most money questions:",
        "1. **Know your numbers**: monthly take-home pay and essential bills.",
        "2. **Build a starter emergency fund** of about $1,000, then grow it to 3-6 months of essentials.",
        "3. **Capture any employer 401(k) match**: it's an immediate return on your money.",
        "4. **Pay down high-interest debt** (credit cards first).",
        "",
        "Try asking about a budget, debt payoff, retirement, taxes, a loan, or contribution limits to see the calculators in action.",
      ].join("\n");
      await streamOut(text, onText);
      return message([{ type: "text", text, citations: null }], "end_turn");
    }

    const lead = "Let me run the numbers for you.";
    await streamOut(lead, onText);
    return message(
      [
        { type: "text", text: lead, citations: null },
        { type: "tool_use", id: `toolu_mock_${Date.now()}`, name: call.name, input: call.input, caller: { type: "direct" } } as Beta.BetaToolUseBlock,
      ],
      "tool_use",
    );
  }
}

function pickTool(text: string, age: number): { name: string; input: Record<string, unknown> } | null {
  const t = text.toLowerCase();
  if (/debt|credit card|payoff|pay off/.test(t))
    return {
      name: "debt_payoff_plan",
      input: {
        debts: [
          { name: "Credit card", balance: 4200, aprPct: 24.9, minimumPayment: 110 },
          { name: "Car loan", balance: 9800, aprPct: 7.5, minimumPayment: 260 },
        ],
        extraMonthlyPayment: 200,
        strategy: "avalanche",
      },
    };
  if (/retire/.test(t))
    return {
      name: "retirement_projection",
      input: {
        currentAge: Math.max(age, 18),
        retirementAge: Math.max(67, age + 1),
        currentSavings: 25000,
        monthlyContribution: 500,
        annualReturnPct: 6,
        inflationPct: 2.5,
        withdrawalRatePct: 4,
      },
    };
  if (/401|ira|hsa|limit|contribut/.test(t)) return { name: "contribution_limits", input: { age, hsaCoverage: "self" } };
  if (/tax|bracket/.test(t)) return { name: "federal_tax_estimate", input: { filingStatus: "single", grossIncome: 65000, preTaxContributions: 3000 } };
  if (/emergency|rainy/.test(t))
    return { name: "emergency_fund_target", input: { monthlyEssentialExpenses: 2500, incomeStability: "stable", dependents: 0, currentSavings: 1200 } };
  if (/\b(loan|car|mortgage|house|home)\b/.test(t)) return { name: "loan_payment", input: { principal: 25000, aprPct: 6.9, years: 5 } };
  if (/budget|spend|paycheck/.test(t)) return { name: "budget_breakdown", input: { monthlyTakeHome: 4000, needsPct: 50, wantsPct: 30, savingsPct: 20 } };
  if (/\b(save|saving|grow|invest|compound)/.test(t))
    return { name: "compound_growth", input: { startingBalance: 1000, monthlyContribution: 200, annualReturnPct: 6, years: 20 } };
  return null;
}

const usd = (n: unknown) => (typeof n === "number" ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : String(n));

function explainToolResult(raw: string): string {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return "Demo mode: I couldn't read that calculation.";
  }
  if ("error" in data) return `Demo mode: the calculator reported a problem: ${String(data.error)}`;
  const lines = ["**Demo mode** (no AI key configured). These are real calculator results using sample numbers:", ""];
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number") lines.push(`- **${humanize(key)}**: ${/pct|rate|months|years|age|year/i.test(key) ? value : usd(value)}`);
    else if (typeof value === "string") lines.push(`- **${humanize(key)}**: ${value}`);
  }
  lines.push("", "With an AI key configured, Dollarsafe explains these results in plain English for your situation and life stage.");
  return lines.join("\n");
}

const humanize = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

async function streamOut(text: string, onText: (d: string) => void) {
  for (const chunk of text.match(/.{1,24}/gs) ?? []) {
    onText(chunk);
    await new Promise((r) => setTimeout(r, 8));
  }
}

function message(content: Beta.BetaContentBlock[], stop: "end_turn" | "tool_use"): Beta.BetaMessage {
  return {
    id: `msg_mock_${Date.now()}`,
    type: "message",
    role: "assistant",
    model: "mock-advisor",
    content,
    stop_reason: stop,
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  } as unknown as Beta.BetaMessage;
}
