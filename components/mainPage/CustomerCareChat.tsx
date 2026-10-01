"use client";

import { useState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Headset,
  X,
  MessageCircle,
  Bug,
  Lightbulb,
  UserRound,
} from "lucide-react";

/**
 * CustomerCareChat
 * Floating support launcher with a "Drop feedback or report an issue" tooltip,
 * an animated chat panel, quick-action chips and a typing indicator.
 * Every message the visitor sends is handed off to your WhatsApp number.
 *
 * Needs: react, lucide-react, tailwindcss.
 * Colours use inline styles so the file works without any Tailwind config.
 */

const BRAND = {
  ink: "#14163A",
  cobalt: "#3347F5",
  mist: "#F1F3FF",
  sun: "#FFC93C",
};

type ChatMessage = {
  id: number;
  from: "bot" | "user";
  text: string;
  link?: string;
};

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  topic?: string;
  prompt?: string;
  direct?: string;
};

// Country code + number, digits only (no "+", spaces or dashes).
const WHATSAPP_NUMBER = "2349137480951";

const waLink = (text: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "issue",
    label: "Report an issue",
    icon: Bug,
    topic: "Issue report",
    prompt:
      "Sorry something isn't working. Describe what happened and where, then send it and we'll continue on WhatsApp.",
  },
  {
    id: "feedback",
    label: "Share feedback",
    icon: Lightbulb,
    topic: "Feedback",
    prompt:
      "We read every note. What would make this better for you? Send it and we'll pick it up on WhatsApp.",
  },
  {
    id: "agent",
    label: "Talk to an agent",
    icon: UserRound,
    direct: "Hi, I'd like to talk to an agent.",
  },
];

export default function CustomerCareChat() {
  const [open, setOpen] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [seen, setSeen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      from: "bot",
      text: "Hi, I'm here to help. Pick a topic below or type your message.",
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(2);

  // Show the tooltip once shortly after load, then tuck it away.
  useEffect(() => {
    const show = setTimeout(() => setTipVisible(true), 1500);
    const hide = setTimeout(() => setTipVisible(false), 10500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, open]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const toggle = () => {
    setOpen((o) => !o);
    setTipVisible(false);
    setSeen(true);
  };

  const botSays = (text: string, link?: string) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: nextId.current++, from: "bot", text, link },
      ]);
    }, 1000);
    timers.current.push(t);
  };

  const userSays = (text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text }]);

  // window.open must run inside the click/keypress to avoid popup blockers.
  const openWhatsApp = (text: string) => {
    const url = waLink(text);
    window.open(url, "_blank", "noopener,noreferrer");
    botSays("Opening WhatsApp so an agent can reply there.", url);
  };

  const pickAction = (action: QuickAction) => {
    userSays(action.label);
    if (action.direct) {
      openWhatsApp(action.direct);
      return;
    }

    if (action.topic) {
      setTopic(action.topic);
    }

    if (action.prompt) {
      botSays(action.prompt);
    }
  };

  const send = () => {
    const clean = draft.trim();
    if (!clean) return;
    userSays(clean);
    setDraft("");
    openWhatsApp(topic ? `${topic}: ${clean}` : clean);
  };

  const hasUserMessage = messages.some((m) => m.from === "user");

  return (
    <div className="cc-root pointer-events-none">
      <div className="pointer-events-auto fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">
        {/* Chat panel */}
        <section
          aria-label="Customer care chat"
          aria-hidden={!open}
          className="flex origin-bottom-right flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          style={{
            width: "min(380px, calc(100vw - 2.5rem))",
            height: "min(560px, calc(100vh - 7.5rem))",
            opacity: open ? 1 : 0,
            transform: open
              ? "translateY(0) scale(1)"
              : "translateY(16px) scale(.92)",
            visibility: open ? "visible" : "hidden",
            pointerEvents: open ? "auto" : "none",
            transition: `opacity .28s ease, transform .35s cubic-bezier(.2,.9,.3,1.1), visibility 0s linear ${
              open ? "0s" : ".3s"
            }`,
          }}
        >
          {/* Header */}
          <header
            className="flex items-center gap-3 px-4 py-4 text-white"
            style={{ background: BRAND.ink }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: BRAND.cobalt }}
            >
              <Headset size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="cc-display text-base font-semibold leading-tight">
                Customer care
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-indigo-200">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: BRAND.sun }}
                />
                Online now, replies on WhatsApp
              </p>
            </div>
            <button
              onClick={toggle}
              aria-label="Close chat"
              className="rounded-full p-2 text-indigo-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            >
              <X size={18} />
            </button>
          </header>

          {/* Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            style={{ background: BRAND.mist }}
            role="log"
            aria-live="polite"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`cc-msg flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "rounded-2xl rounded-br-md text-white"
                      : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800"
                  }`}
                  style={
                    m.from === "user" ? { background: BRAND.cobalt } : undefined
                  }
                >
                  {m.text}
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 font-medium underline"
                      style={{ color: "#128C7E" }}
                    >
                      <MessageCircle size={14} />
                      Open WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}

            {!hasUserMessage && (
              <div className="cc-msg flex flex-wrap gap-2 pt-1">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => pickAction(action)}
                      className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                      style={{ borderColor: BRAND.cobalt, color: BRAND.cobalt }}
                    >
                      <Icon size={14} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}

            {typing && (
              <div
                className="cc-msg flex justify-start"
                aria-label="Agent is typing"
              >
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="cc-dot inline-block h-1.5 w-1.5 rounded-full bg-slate-500"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type your message for WhatsApp"
              aria-label="Message"
              tabIndex={open ? 0 : -1}
              className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Send on WhatsApp"
              tabIndex={open ? 0 : -1}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "#128C7E" }}
            >
              <MessageCircle size={18} />
            </button>
          </div>
        </section>

        {/* Launcher + tooltip */}
        <div
          className="relative"
          onMouseEnter={() => !open && setTipVisible(true)}
          onMouseLeave={() => setTipVisible(false)}
        >
          {tipVisible && !open && (
            <div
              role="tooltip"
              className="cc-tip absolute bottom-full right-0 mb-3 w-max origin-bottom-right"
              style={{ maxWidth: "15rem" }}
            >
              <div
                className="relative flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium leading-snug text-white shadow-xl"
                style={{ background: BRAND.ink }}
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: BRAND.sun }}
                />
                <span>Drop feedback or report an issue</span>
                <button
                  onClick={() => setTipVisible(false)}
                  aria-label="Dismiss tooltip"
                  className="-mr-1 -mt-0.5 rounded-full p-1 text-indigo-200 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                >
                  <X size={12} />
                </button>
                {/* tail */}
                <span
                  className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45"
                  style={{ background: BRAND.ink }}
                />
              </div>
            </div>
          )}

          <button
            onClick={toggle}
            aria-label={
              open ? "Close customer care chat" : "Open customer care chat"
            }
            aria-expanded={open}
            className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
            style={{ background: BRAND.cobalt }}
          >
            {!open && !seen && (
              <span
                className="cc-ring absolute inset-0 rounded-full"
                style={{ background: BRAND.cobalt }}
              />
            )}
            <Headset
              size={24}
              className="absolute transition-all duration-300"
              style={{
                opacity: open ? 0 : 1,
                transform: open
                  ? "rotate(90deg) scale(.5)"
                  : "rotate(0) scale(1)",
              }}
            />
            <X
              size={24}
              className="absolute transition-all duration-300"
              style={{
                opacity: open ? 1 : 0,
                transform: open
                  ? "rotate(0) scale(1)"
                  : "rotate(-90deg) scale(.5)",
              }}
            />
            {!open && !seen && (
              <span
                className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                style={{ background: BRAND.sun }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
