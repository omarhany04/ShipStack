'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  renderedText: string;
  suggestions: string[];
  timestamp: string;
  provider?: string;
  isTyping?: boolean;
}

interface ChatApiResponse {
  answer?: string;
  followUpSuggestions?: string[];
  provider?: string;
}

const MAX_MESSAGES = 12;
const ASSISTANT_TYPING_INTERVAL_MS = 24;

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatMessageTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function buildInitialMessage(pathname: string): ChatMessage {
  const suggestions =
    pathname === '/projects'
      ? ['How do I reopen a workspace?', 'How do I inspect its database?', 'How do downloads work?']
      : pathname === '/account'
        ? ['How do I change my password?', 'How do I update my photo?', 'How does Google sign-in work?']
        : pathname.startsWith('/projects/')
          ? ['How do I inspect this project database?', 'How do I download this workspace?', 'How do previews work?']
          : ['How does project generation work?', 'How do I edit a blueprint?', 'Where are my saved projects?'];

  return {
    id: createId('assistant'),
    role: 'assistant',
    text:
      "I'm your ShipStack assistant. Ask me about generation, blueprint editing, previews, project databases, saved workspaces, or account settings.",
    renderedText:
      "I'm your ShipStack assistant. Ask me about generation, blueprint editing, previews, project databases, saved workspaces, or account settings.",
    suggestions,
    timestamp: formatMessageTime(),
    provider: 'assistant',
  };
}

export default function WebsiteAssistant() {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildInitialMessage('/')]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typingJob, setTypingJob] = useState<{
    messageId: string;
    fullText: string;
  } | null>(null);

  const shouldHide = pathname?.startsWith('/auth');

  useEffect(() => {
    if (!pathname) {
      return;
    }

    setMessages((current) => {
      if (current.length === 1 && current[0]?.provider === 'assistant') {
        return [buildInitialMessage(pathname)];
      }

      return current;
    });
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSubmitting, typingJob]);

  useEffect(() => {
    if (!typingJob) {
      return;
    }

    let currentLength = 0;
    const chunk = typingJob.fullText.length > 240 ? 4 : typingJob.fullText.length > 120 ? 3 : 2;
    const timer = window.setInterval(() => {
      currentLength = Math.min(currentLength + chunk, typingJob.fullText.length);

      setMessages((current) =>
        current.map((message) =>
          message.id === typingJob.messageId
            ? {
                ...message,
                renderedText: typingJob.fullText.slice(0, currentLength),
                isTyping: currentLength < typingJob.fullText.length,
              }
            : message
        )
      );

      if (currentLength >= typingJob.fullText.length) {
        window.clearInterval(timer);
        setTypingJob(null);
      }
    }, ASSISTANT_TYPING_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [typingJob]);

  const latestAssistantMessageId = useMemo(() => {
    const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    return latestAssistant?.id ?? null;
  }, [messages]);

  if (shouldHide) {
    return null;
  }

  async function submitMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || isSubmitting || typingJob) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      text,
      renderedText: text,
      suggestions: [],
      timestamp: formatMessageTime(),
    };

    const nextMessages = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(nextMessages);
    setInput('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPath: pathname,
          messages: nextMessages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ChatApiResponse;
      const fullText =
        typeof payload.answer === 'string' && payload.answer.trim()
          ? payload.answer.trim()
          : 'I can help with ShipStack generation, previews, blueprints, saved projects, and account settings.';

      const assistantMessage: ChatMessage = {
        id: createId('assistant'),
        role: 'assistant',
        text: fullText,
        renderedText: '',
        suggestions: Array.isArray(payload.followUpSuggestions)
          ? payload.followUpSuggestions.filter(Boolean).slice(0, 3)
          : [],
        timestamp: formatMessageTime(),
        provider: payload.provider,
        isTyping: true,
      };

      setMessages((current) => [...current, assistantMessage].slice(-MAX_MESSAGES));
      setTypingJob({
        messageId: assistantMessage.id,
        fullText,
      });
    } catch {
      const fallbackText =
        'I can help with ShipStack generation, blueprints, previews, saved projects, and account settings.';
      const assistantMessage: ChatMessage = {
        id: createId('assistant'),
        role: 'assistant',
        text: fallbackText,
        renderedText: '',
        suggestions: [
          'How does project generation work?',
          'How do I edit a blueprint?',
          'Where are my saved projects?',
        ],
        timestamp: formatMessageTime(),
        provider: 'fallback',
        isTyping: true,
      };

      setMessages((current) => [...current, assistantMessage].slice(-MAX_MESSAGES));
      setTypingJob({
        messageId: assistantMessage.id,
        fullText: fallbackText,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function skipTyping() {
    if (!typingJob) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === typingJob.messageId
          ? {
              ...message,
              renderedText: typingJob.fullText,
              isTyping: false,
            }
          : message
      )
    );
    setTypingJob(null);
  }

  function resetConversation() {
    setMessages([buildInitialMessage(pathname || '/')]);
    setInput('');
    setTypingJob(null);
    setIsSubmitting(false);
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[85]">
      {isOpen ? (
        <section className="pointer-events-auto flex h-[min(600px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_40%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.98))] px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                  ShipStack Assistant
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:bg-white/[0.14] hover:text-white"
                  aria-label="Start a new conversation"
                  title="New chat"
                >
                  <RefreshIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:bg-white/[0.14] hover:text-white"
                  aria-label="Close assistant"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => {
              const isLatestAssistant = message.id === latestAssistantMessageId;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-[22px] px-4 py-3 text-sm leading-7 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-slate-950 text-white'
                          : 'border border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {message.renderedText || (message.role === 'assistant' && message.isTyping ? '' : message.text)}
                      </p>
                    </div>

                    <p
                      className={`mt-2 px-1 text-[11px] font-medium text-slate-400 ${
                        message.role === 'user' ? 'text-right' : ''
                      }`}
                    >
                      {message.timestamp}
                    </p>

                    {message.role === 'assistant' &&
                    isLatestAssistant &&
                    !message.isTyping &&
                    message.suggestions.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => void submitMessage(suggestion)}
                            disabled={isSubmitting || Boolean(typingJob)}
                            className="rounded-full border border-slate-200 bg-slate-100/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-300/90 hover:text-slate-900 disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {isSubmitting ? (
              <div className="flex justify-start">
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <TypingDot delay="0ms" />
                    <TypingDot delay="120ms" />
                    <TypingDot delay="240ms" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4">
            {typingJob ? (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={skipTyping}
                  className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
                >
                  Skip typing
                </button>
              </div>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitMessage(input);
              }}
              className="flex items-end gap-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about generation, previews, blueprints, projects..."
                disabled={isSubmitting || Boolean(typingJob)}
                className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSubmitting || Boolean(typingJob)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#0f172a,_#1e293b)] text-white shadow-[0_24px_55px_rgba(15,23,42,0.28)] transition hover:scale-[1.02]"
          aria-label="Open website assistant"
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.35),_transparent_48%)] opacity-90" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
          <AssistantGlyph />
        </button>
      )}
    </div>
  );
}

function AssistantGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="relative h-7 w-7 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75a6.75 6.75 0 0 0-6.75 6.75v3.75A2.25 2.25 0 0 0 7.5 16.5h9a2.25 2.25 0 0 0 2.25-2.25V10.5A6.75 6.75 0 0 0 12 3.75Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.008v.008H9.75V9.75Zm4.5 0h.008v.008h-.008V9.75ZM8.25 15.75h7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3V1.75M5.75 7 4.5 5.75m13.75 1.5 1.25-1.25" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.75 19.25 14.5-7.25-14.5-7.25 2.5 7.25-2.5 7.25Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.25 12h12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.977V4.37" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9.51a9 9 0 1 0 2.13 5.32" />
    </svg>
  );
}

function TypingDot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 rounded-full bg-slate-300 animate-pulse"
      style={{ animationDelay: delay }}
    />
  );
}
