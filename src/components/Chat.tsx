"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "./api";

interface ProfileLite {
  id: string;
  displayName: string;
  stageLabel: string;
  stageId: string;
}
interface Notice {
  kind: string;
  message: string;
}
interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  notices?: Notice[];
  pending?: boolean;
}
interface ConversationLite {
  id: string;
  title: string;
  profileId: string;
}

const STARTERS: Record<string, string[]> = {
  teen: ["How should I split my first paycheck?", "What's the difference between a debit and credit card?", "How much would I have if I saved $50 a month until I'm 30?"],
  young_adult: ["Help me make my first budget on $2,800 a month", "How do I build credit from zero?", "Should I pay off student loans or start a Roth IRA?"],
  early_career: ["Avalanche vs. snowball for my credit cards?", "How much should my emergency fund be?", "How much can I put in my 401(k) and IRA this year?"],
  family_builder: ["How do we balance retirement and college savings?", "What would a $350,000 mortgage at 6.5% cost per month?", "How much life insurance do families usually need?"],
  pre_retiree: ["Am I on track to retire at 65?", "How do catch-up contributions work for me?", "What should I know about claiming Social Security?"],
  retiree: ["How much can I safely withdraw each year?", "What are required minimum distributions?", "Someone from 'Medicare' called asking for my number. Is it a scam?"],
};

const noticeStyle: Record<string, string> = {
  crisis: "border-red-300 bg-red-50 text-red-900",
  scam: "border-amber-300 bg-amber-50 text-amber-900",
  privacy: "border-sky-300 bg-sky-50 text-sky-900",
  referral: "border-violet-300 bg-violet-50 text-violet-900",
  education_only: "border-slate-300 bg-slate-50 text-slate-800",
};

export function Chat(props: { profiles: ProfileLite[]; planName: string; used: number; limit: number }) {
  const [profileId, setProfileId] = useState(props.profiles[0].id);
  const [conversations, setConversations] = useState<ConversationLite[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; quota?: boolean } | null>(null);
  const [used, setUsed] = useState(props.used);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profile = props.profiles.find((p) => p.id === profileId)!;

  const loadConversations = useCallback(async () => {
    const { conversations } = await api<{ conversations: ConversationLite[] }>(`/api/conversations?profileId=${profileId}`);
    setConversations(conversations);
  }, [profileId]);

  useEffect(() => {
    loadConversations().catch(() => undefined);
    setConversationId(null);
    setMessages([]);
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  async function openConversation(id: string) {
    setSidebarOpen(false);
    setError(null);
    const { conversation } = await api<{ conversation: { messages: ChatMessage[] } }>(`/api/conversations/${id}`);
    setConversationId(id);
    setMessages(conversation.messages);
  }

  async function deleteConversation(id: string) {
    if (!confirm("Delete this conversation?")) return;
    await api(`/api/conversations/${id}`, { method: "DELETE" });
    if (id === conversationId) {
      setConversationId(null);
      setMessages([]);
    }
    loadConversations();
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setInput("");
    setError(null);
    setStreaming(true);
    const assistantId = `a-${Date.now()}`;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "USER", content: message }, { id: assistantId, role: "ASSISTANT", content: "", notices: [], pending: true }]);
    const patch = (fn: (m: ChatMessage) => ChatMessage) => setMessages((all) => all.map((m) => (m.id === assistantId ? fn(m) : m)));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, profileId, conversationId: conversationId ?? undefined }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setMessages((all) => all.filter((m) => m.id !== assistantId));
        setError({ message: data.error ?? "Something went wrong.", quota: data.code === "quota_exceeded" });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const event = raw.match(/^event: (.*)$/m)?.[1];
          const dataLine = raw.match(/^data: (.*)$/m)?.[1];
          if (!event || !dataLine) continue;
          const data = JSON.parse(dataLine);
          if (event === "meta") {
            if (!conversationId) setConversationId(data.conversationId);
          } else if (event === "notice") {
            patch((m) => ({ ...m, notices: [...(m.notices ?? []), data] }));
          } else if (event === "status") {
            setStatus(data.message);
          } else if (event === "text") {
            setStatus(null);
            patch((m) => ({ ...m, content: m.content + data.text }));
          } else if (event === "done") {
            patch((m) => ({ ...m, pending: false }));
            if (data.counted) setUsed((u) => u + 1);
          } else if (event === "error") {
            patch((m) => ({ ...m, pending: false }));
            setError({ message: data.message });
          }
        }
      }
    } catch {
      setError({ message: "Connection lost. Please try again." });
    } finally {
      setStreaming(false);
      setStatus(null);
      patch((m) => ({ ...m, pending: false }));
      loadConversations().catch(() => undefined);
    }
  }

  const remaining = Math.max(0, props.limit - used);

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-6xl">
      <aside className={`${sidebarOpen ? "fixed inset-0 z-30 flex" : "hidden"} w-full flex-col border-r border-slate-200 bg-white p-4 md:static md:flex md:w-72`}>
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-semibold">Conversations</span>
          <button className="btn-secondary" onClick={() => setSidebarOpen(false)}>Close</button>
        </div>
        {props.profiles.length > 1 && (
          <div className="mb-3">
            <label className="label" htmlFor="profile">Coaching for</label>
            <select id="profile" className="input" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {props.profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName} ({p.stageLabel})</option>
              ))}
            </select>
          </div>
        )}
        <button
          className="btn-primary mb-4 w-full"
          onClick={() => {
            setConversationId(null);
            setMessages([]);
            setSidebarOpen(false);
          }}
        >
          New conversation
        </button>
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className="group flex items-center">
              <button
                className={`flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${c.id === conversationId ? "bg-brand-50 text-brand-900" : "text-slate-700 hover:bg-slate-100"}`}
                onClick={() => openConversation(c.id)}
              >
                {c.title}
              </button>
              <button aria-label="Delete conversation" className="px-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600" onClick={() => deleteConversation(c.id)}>×</button>
            </li>
          ))}
          {!conversations.length && <li className="px-3 text-sm text-slate-500">No conversations yet.</li>}
        </ul>
        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
          <p>{props.planName}: {remaining} of {props.limit} questions left this month</p>
          <div className="mt-1 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (used / props.limit) * 100)}%` }} /></div>
          <Link className="mt-2 inline-block underline" href="/profiles">Edit profile</Link>
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          <button className="btn-secondary" onClick={() => setSidebarOpen(true)}>☰ Conversations</button>
          <span className="truncate text-sm text-slate-600">{profile.displayName} · {profile.stageLabel}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl pt-6 text-center">
              <h1 className="text-2xl font-bold">Hi {profile.displayName}, what&apos;s on your mind about money?</h1>
              <p className="mt-2 text-sm text-slate-600">Guidance tuned for: {profile.stageLabel}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {(STARTERS[profile.stageId] ?? STARTERS.early_career).map((s) => (
                  <button key={s} className="card p-4 text-left text-sm hover:border-brand-500" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((m) =>
                m.role === "USER" ? (
                  <div key={m.id} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-600 px-4 py-3 text-sm text-white">{m.content}</div>
                ) : (
                  <div key={m.id} className="space-y-2">
                    {m.notices?.map((n, i) => (
                      <div key={i} role="note" className={`rounded-xl border px-3 py-2 text-sm ${noticeStyle[n.kind] ?? noticeStyle.education_only}`}>{n.message}</div>
                    ))}
                    <div className="prose-answer max-w-[95%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      {m.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>{m.content}</ReactMarkdown>
                      ) : (
                        <span className="text-sm text-slate-500">{status ?? "Thinking…"}</span>
                      )}
                      {m.pending && m.content && status && <p className="mt-2 text-xs text-slate-500">{status}</p>}
                    </div>
                  </div>
                ),
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div role="alert" className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error.message} {error.quota && <Link className="font-semibold underline" href="/pricing">See plans</Link>}
              </div>
            )}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                className="input max-h-40 min-h-[44px] flex-1 resize-none"
                rows={1}
                maxLength={4000}
                placeholder="Ask about budgeting, debt, saving, retirement, taxes…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <button className="btn-primary h-[44px]" disabled={streaming || !input.trim()}>{streaming ? "…" : "Send"}</button>
            </form>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              AI-generated financial education, not individualized investment, tax or legal advice. Don&apos;t share account numbers or your SSN.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
