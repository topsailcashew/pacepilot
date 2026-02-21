import React from 'react';
import {
  AlertTriangle,
  Calendar,
  RefreshCw,
  FileText,
  BellOff,
  X,
} from 'lucide-react';
import type { AppNotification, NotificationType } from '@/types';

// ─── Icon + colour maps ───────────────────────────────────────────────────────

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  overdue_task: <AlertTriangle size={14} />,
  calendar_event: <Calendar size={14} />,
  habit_due: <RefreshCw size={14} />,
  report_reminder: <FileText size={14} />,
};

const COLOUR_MAP: Record<NotificationType, string> = {
  overdue_task: 'text-red-400',
  calendar_event: 'text-blue-400',
  habit_due: 'text-pilot-orange',
  report_reminder: 'text-purple-400',
};

// ─── Single notification row ──────────────────────────────────────────────────

interface NotificationItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  onNavigate: (href: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onNavigate,
}) => {
  const { id, type, title, subtitle, href } = notification;

  return (
    <div className="group flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0">
      {/* Icon */}
      <div
        className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 ${COLOUR_MAP[type]}`}
      >
        {ICON_MAP[type]}
      </div>

      {/* Text — clickable to navigate */}
      <button
        onClick={() => onNavigate(href)}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-xs font-bold text-white/80 truncate">{title}</p>
        {subtitle && (
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </button>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        aria-label={`Dismiss: ${title}`}
        className="shrink-0 p-1 text-white/20 hover:text-white/60 transition-colors rounded opacity-0 group-hover:opacity-100 mt-0.5"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  notifications: AppNotification[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (href: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  dismissedIds,
  onDismiss,
  onClearAll,
  onNavigate,
}) => {
  const visible = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = visible.length;

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute top-full right-0 mt-2 w-80 z-[150] bg-prussianblue border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-deepnavy/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[9px] font-black text-pilot-orange bg-pilot-orange/10 border border-pilot-orange/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              {unreadCount} active
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-72 overflow-y-auto custom-scrollbar">
        {visible.length === 0 ? (
          /* Empty state */
          <div className="py-10 flex flex-col items-center gap-3">
            <BellOff size={28} className="text-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                All clear
              </p>
              <p className="text-xs text-white/10 mt-1">No pending notifications.</p>
            </div>
          </div>
        ) : (
          visible.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onDismiss={onDismiss}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
};
