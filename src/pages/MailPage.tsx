import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail,
  Send,
  Trash2,
  RefreshCw,
  ChevronLeft,
  Reply,
  ReplyAll,
  PenSquare,
  X,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';
import { signInWithGoogle, logOut } from '@/services/appwriteService';
import {
  listInboxThreads,
  getThread,
  markAsRead,
  sendMessage,
  trashThread,
  header,
  extractBody,
} from '@/services/gmailService';
import type { GmailThread, GmailMessage, GmailThreadSummary } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isThisYear) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatFullDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function senderName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return (match ? match[1].trim() : from.split('@')[0] || from).trim();
}

function senderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Deterministic pastel hue from sender string
function avatarHue(from: string): number {
  let h = 0;
  for (let i = 0; i < from.length; i++) h = (h * 31 + from.charCodeAt(i)) % 360;
  return h;
}

// Parse all recipient addresses from a header value like "A <a@b.com>, B <b@c.com>"
function parseAddresses(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

// ─── Compose modal ────────────────────────────────────────────────────────────

interface ComposeProps {
  token: string;
  onClose: () => void;
  onSent: () => void;
  replyTo?: GmailMessage;
  replyAll?: boolean;
  threadId?: string;
}

const ComposeModal: React.FC<ComposeProps> = ({ token, onClose, onSent, replyTo, replyAll, threadId }) => {
  const { addToast } = useAppStore();

  const buildReplyTo = (): string => {
    if (!replyTo) return '';
    if (!replyAll) return header(replyTo, 'From');
    const from = header(replyTo, 'From');
    const to = header(replyTo, 'To');
    const cc = header(replyTo, 'Cc');
    const all = [from, ...parseAddresses(to), ...parseAddresses(cc)].filter(Boolean);
    return [...new Set(all)].join(', ');
  };

  const [to, setTo] = useState(buildReplyTo);
  const [cc, setCc] = useState(replyAll ? header(replyTo!, 'Cc') : '');
  const [showCc, setShowCc] = useState(replyAll && !!header(replyTo!, 'Cc'));
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${header(replyTo, 'Subject').replace(/^Re:\s*/i, '')}` : ''
  );
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !body.trim()) return;
    setSending(true);
    try {
      await sendMessage(token, {
        to,
        cc: cc.trim() || undefined,
        subject,
        body,
        threadId,
        inReplyTo: replyTo ? header(replyTo, 'Message-ID') : undefined,
        references: replyTo ? header(replyTo, 'References') || header(replyTo, 'Message-ID') : undefined,
      });
      addToast('success', 'Email sent.');
      onSent();
      onClose();
    } catch {
      addToast('error', 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-deepnavy border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-prussianblue/50">
          <h3 className="text-xs font-black uppercase tracking-widest text-white">
            {replyTo ? (replyAll ? 'Reply All' : 'Reply') : 'New Message'}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-3">
          {/* To */}
          <div className="flex items-start gap-3">
            <label className={`${THEME.label} pt-3 w-8 shrink-0 text-right`}>To</label>
            <div className="flex-1">
              <input
                className={`${THEME.input} w-full`}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
              />
            </div>
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors pt-3"
              >
                Cc
              </button>
            )}
          </div>

          {/* Cc */}
          {showCc && (
            <div className="flex items-start gap-3">
              <label className={`${THEME.label} pt-3 w-8 shrink-0 text-right`}>Cc</label>
              <input
                className={`${THEME.input} w-full`}
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-start gap-3">
            <label className={`${THEME.label} pt-3 w-8 shrink-0 text-right`}>Subj</label>
            <input
              className={`${THEME.input} w-full`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </div>

          {/* Body */}
          <div className="pt-1">
            <textarea
              className={`${THEME.input} w-full resize-none`}
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={sending}
              className={`${THEME.buttonPrimary} px-5 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50`}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${THEME.buttonSecondary} px-4 py-2.5 text-xs font-black uppercase tracking-widest`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Single message bubble ────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: GmailMessage;
  isLast: boolean;
  token: string;
  threadId: string;
  onReply: (replyAll: boolean) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isLast, onReply }) => {
  const from = header(msg, 'From');
  const to = header(msg, 'To');
  const cc = header(msg, 'Cc');
  const date = header(msg, 'Date');
  const name = senderName(from) || senderEmail(from);
  const hue = avatarHue(from);
  const { html, text } = extractBody(msg);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Collapse older messages by default; always expand the last one
  const [expanded, setExpanded] = useState(isLast);
  const [showDetails, setShowDetails] = useState(false);

  const autoResizeIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    iframe.style.height = '0';
    iframe.style.height = iframe.contentDocument.body.scrollHeight + 8 + 'px';
  };

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
      {/* Message header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
          style={{ backgroundColor: `hsl(${hue},45%,30%)`, border: `1px solid hsl(${hue},45%,45%)` }}
        >
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold text-white truncate">{name}</span>
            {!expanded && (
              <span className="text-[10px] text-white/20 truncate hidden sm:block">
                {msg.snippet}
              </span>
            )}
          </div>
          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetails((v) => !v); }}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1 mt-0.5"
            >
              <span>to {parseAddresses(to).map(senderName).join(', ') || 'me'}</span>
              {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-white/30">{formatDate(date)}</span>
          {expanded ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
        </div>
      </button>

      {/* Expanded details strip */}
      {expanded && showDetails && (
        <div className="px-4 pb-3 pt-0 border-t border-white/5 bg-white/[0.01] space-y-1">
          <div className="flex gap-2 text-[10px]">
            <span className={THEME.label}>From</span>
            <span className="text-white/50">{from}</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className={THEME.label}>To</span>
            <span className="text-white/50">{to || 'me'}</span>
          </div>
          {cc && (
            <div className="flex gap-2 text-[10px]">
              <span className={THEME.label}>Cc</span>
              <span className="text-white/50">{cc}</span>
            </div>
          )}
          <div className="flex gap-2 text-[10px]">
            <span className={THEME.label}>Date</span>
            <span className="text-white/50">{formatFullDate(date)}</span>
          </div>
        </div>
      )}

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          {html ? (
            <iframe
              ref={iframeRef}
              srcDoc={`<!DOCTYPE html><html><head><style>
                * { box-sizing: border-box; }
                body {
                  background: transparent;
                  color: rgba(255,255,255,0.75);
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  font-size: 13px;
                  line-height: 1.65;
                  margin: 0;
                  padding: 4px 0;
                  word-break: break-word;
                  overflow-wrap: break-word;
                }
                a { color: #F37324; text-decoration: none; }
                a:hover { text-decoration: underline; }
                img { max-width: 100%; height: auto; border-radius: 6px; }
                blockquote {
                  border-left: 2px solid rgba(255,255,255,0.1);
                  margin: 8px 0;
                  padding: 4px 12px;
                  color: rgba(255,255,255,0.3);
                  font-style: italic;
                }
                pre, code {
                  background: rgba(255,255,255,0.05);
                  border-radius: 4px;
                  padding: 2px 6px;
                  font-size: 12px;
                }
                pre { padding: 10px 12px; overflow-x: auto; }
                table { border-collapse: collapse; width: 100%; }
                td, th { padding: 6px 8px; border: 1px solid rgba(255,255,255,0.08); }
                hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); }
                h1,h2,h3,h4 { color: rgba(255,255,255,0.9); font-weight: 700; margin: 12px 0 6px; }
                p { margin: 0 0 8px; }
                ul, ol { padding-left: 20px; margin: 6px 0; }
              </style></head><body>${html}</body></html>`}
              className="w-full border-0 block"
              style={{ minHeight: '60px' }}
              sandbox="allow-same-origin allow-popups"
              onLoad={autoResizeIframe}
              title="Email content"
            />
          ) : (
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-sans">
              {text}
            </p>
          )}

          {/* Reply actions */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
            <button
              onClick={() => onReply(false)}
              className={`${THEME.buttonSecondary} px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}
            >
              <Reply size={12} /> Reply
            </button>
            {(header(msg, 'To') || header(msg, 'Cc')) && (
              <button
                onClick={() => onReply(true)}
                className={`${THEME.buttonSecondary} px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}
              >
                <ReplyAll size={12} /> Reply All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Thread detail ────────────────────────────────────────────────────────────

interface ThreadViewProps {
  thread: GmailThread;
  token: string;
  onBack: () => void;
  onRefresh: () => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({ thread, token, onBack, onRefresh }) => {
  const { addToast } = useAppStore();
  const [replyState, setReplyState] = useState<{ msg: GmailMessage; replyAll: boolean } | null>(null);

  const lastMsg = thread.messages[thread.messages.length - 1];
  const subject = header(lastMsg, 'Subject') || '(no subject)';

  const handleTrash = async () => {
    try {
      await trashThread(token, thread.id);
      addToast('info', 'Thread moved to trash.');
      onBack();
      onRefresh();
    } catch {
      addToast('error', 'Could not trash thread.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="flex-1 text-sm font-bold text-white truncate">{subject}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setReplyState({ msg: lastMsg, replyAll: false })}
            className={`${THEME.buttonSecondary} px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}
          >
            <Reply size={12} /> Reply
          </button>
          <button
            onClick={() => setReplyState({ msg: lastMsg, replyAll: true })}
            className={`${THEME.buttonSecondary} px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}
          >
            <ReplyAll size={12} /> All
          </button>
          <button
            onClick={handleTrash}
            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            aria-label="Trash thread"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 p-4">
        {thread.messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isLast={i === thread.messages.length - 1}
            token={token}
            threadId={thread.id}
            onReply={(replyAll) => setReplyState({ msg, replyAll })}
          />
        ))}
      </div>

      {replyState && (
        <ComposeModal
          token={token}
          onClose={() => setReplyState(null)}
          onSent={onRefresh}
          replyTo={replyState.msg}
          replyAll={replyState.replyAll}
          threadId={thread.id}
        />
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export const MailPage: React.FC = () => {
  const { googleAccessToken, addToast } = useAppStore();
  const token = googleAccessToken;

  const [threads, setThreads] = useState<GmailThreadSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gmailAuthError, setGmailAuthError] = useState<'scope' | 'api_disabled' | false>(false);
  const [selectedThread, setSelectedThread] = useState<GmailThread | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [composing, setComposing] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const hasFetched = useRef(false);

  const handleConnectGmail = async () => {
    setReconnecting(true);
    try {
      await logOut();
    } catch {
      // Ignore logout errors — proceed to OAuth regardless
    }
    signInWithGoogle();
  };

  const fetchThreads = useCallback(async (refresh = false) => {
    if (!token) return;
    if (refresh) setLoading(true);
    try {
      const result = await listInboxThreads(token, 25);
      if (result.authError) { setGmailAuthError(result.authError); return; }
      setGmailAuthError(false);
      setThreads(result.threads);
      setNextPageToken(result.nextPageToken);
    } catch {
      addToast('error', 'Could not load inbox. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  useEffect(() => {
    if (!token || hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    fetchThreads(false).finally(() => setLoading(false));
  }, [token, fetchThreads]);

  const loadMore = async () => {
    if (!token || !nextPageToken) return;
    setLoadingMore(true);
    try {
      const result = await listInboxThreads(token, 25, nextPageToken);
      setThreads((prev) => [...prev, ...result.threads]);
      setNextPageToken(result.nextPageToken);
    } catch {
      addToast('error', 'Could not load more emails.');
    } finally {
      setLoadingMore(false);
    }
  };

  const openThread = async (summary: GmailThreadSummary) => {
    if (!token) return;
    setLoadingThread(true);
    setSelectedThread(null);
    try {
      const thread = await getThread(token, summary.id);
      setSelectedThread(thread);
      if (summary.unread) {
        thread.messages
          .filter((m) => m.labelIds?.includes('UNREAD'))
          .forEach((m) => markAsRead(token, m.id).catch(() => {}));
        setThreads((prev) =>
          prev.map((t) => (t.id === summary.id ? { ...t, unread: false } : t))
        );
      }
    } catch {
      addToast('error', 'Could not open thread.');
    } finally {
      setLoadingThread(false);
    }
  };

  if (!token || gmailAuthError) {
    const isApiDisabled = gmailAuthError === 'api_disabled';
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <Mail size={40} className="text-white/10" />
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-white/40">
            {isApiDisabled ? 'Gmail API not enabled' : 'Gmail access required'}
          </p>
          {isApiDisabled ? (
            <div className="text-xs text-white/30 max-w-sm leading-relaxed space-y-3">
              <p>The Gmail API is not enabled in your Google Cloud project. Enable it to use this feature:</p>
              <ol className="text-left space-y-1.5 text-white/40 list-decimal list-inside">
                <li>Open <span className="text-white/60 font-bold">console.cloud.google.com</span></li>
                <li>Go to <span className="text-white/60 font-bold">APIs &amp; Services → Library</span></li>
                <li>Search <span className="text-white/60 font-bold">"Gmail API"</span> and click Enable</li>
                <li>Come back and click <span className="text-white/60 font-bold">Connect Gmail</span> below</li>
              </ol>
            </div>
          ) : (
            <p className="text-xs text-white/30 max-w-xs leading-relaxed">
              PacePilot needs Gmail permission. Click below to reconnect your Google account with Gmail access.
            </p>
          )}
        </div>
        <button
          onClick={handleConnectGmail}
          disabled={reconnecting}
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60`}
        >
          {reconnecting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          {reconnecting ? 'Redirecting…' : 'Connect Gmail'}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex items-center justify-end mb-6 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { hasFetched.current = false; setLoading(true); fetchThreads(true); }}
            disabled={loading}
            className={`${THEME.buttonSecondary} px-4 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setComposing(true)}
            className={`${THEME.buttonPrimary} px-4 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}
          >
            <PenSquare size={14} /> Compose
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden gap-6 min-h-0">
        {/* Thread list */}
        <div className={`${selectedThread ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[360px] shrink-0`}>
          <div className={`${THEME.card} !p-0 flex-1 overflow-hidden flex flex-col`}>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-white/20" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <Inbox size={32} className="text-white/10" />
                <p className="text-xs font-black uppercase tracking-widest text-white/20">Inbox empty</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openThread(t)}
                    className={`w-full text-left px-5 py-4 hover:bg-white/[0.03] transition-colors ${
                      selectedThread?.id === t.id ? 'bg-pilot-orange/5 border-l-2 border-pilot-orange' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Mini avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white"
                        style={{ backgroundColor: `hsl(${avatarHue(t.from)},45%,28%)`, border: `1px solid hsl(${avatarHue(t.from)},45%,42%)` }}
                      >
                        {initials(senderName(t.from) || t.from)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className={`text-xs font-bold truncate ${t.unread ? 'text-white' : 'text-white/70'}`}>
                            {senderName(t.from) || t.from}
                          </span>
                          <span className="text-[10px] text-white/20 shrink-0">{formatDate(t.date)}</span>
                        </div>
                        <p className={`text-[11px] truncate mb-0.5 ${t.unread ? 'font-semibold text-white/80' : 'text-white/50'}`}>
                          {t.subject}
                        </p>
                        <p className="text-[10px] text-white/20 truncate">{t.snippet}</p>
                      </div>
                      {t.unread && (
                        <div className="w-2 h-2 rounded-full bg-pilot-orange shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
                {nextPageToken && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
                    Load more
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thread detail panel */}
        {(selectedThread || loadingThread) && (
          <div className={`${THEME.card} !p-0 flex-1 min-w-0 overflow-hidden flex flex-col`}>
            {loadingThread ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-white/20" />
              </div>
            ) : selectedThread ? (
              <ThreadView
                thread={selectedThread}
                token={token}
                onBack={() => setSelectedThread(null)}
                onRefresh={() => { hasFetched.current = false; fetchThreads(true); }}
              />
            ) : null}
          </div>
        )}

        {/* Empty detail placeholder */}
        {!selectedThread && !loadingThread && (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Mail size={32} className="text-white/10" />
              <p className="text-xs font-black uppercase tracking-widest text-white/20">Select a thread</p>
            </div>
          </div>
        )}
      </div>

      {composing && token && (
        <ComposeModal
          token={token}
          onClose={() => setComposing(false)}
          onSent={() => { hasFetched.current = false; fetchThreads(true); }}
        />
      )}
    </div>
  );
};
