/**
 * FilesPage — Google Drive browser.
 *
 * Features:
 *  • Folder navigation with breadcrumb trail
 *  • Debounced search (searches all of Drive by name)
 *  • Grid / List view toggle
 *  • "Recent" quick-access tab
 *  • Open file / folder in Google Drive (new tab)
 *  • Prompts to reconnect Google if no access token
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderOpen,
  ChevronRight,
  Search,
  RefreshCw,
  Loader,
  LayoutGrid,
  List,
  Clock,
  Home,
  ExternalLink,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';
import {
  listDriveFiles,
  searchDriveFiles,
  listRecentDriveFiles,
  getDriveFile,
  formatSize,
  formatDriveDate,
  KIND_EMOJI,
  KIND_COLOR,
} from '@/services/googleDriveService';
import type { DriveFile, DriveBreadcrumb } from '@/services/googleDriveService';

// ── View mode ──────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';
type TabMode  = 'browse' | 'recent';

// ── File card (grid) ───────────────────────────────────────────────────────────

const FileCard: React.FC<{ file: DriveFile; onClick: () => void }> = ({ file, onClick }) => (
  <button
    onClick={onClick}
    title={file.name}
    className="group relative flex flex-col items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left active:scale-95"
  >
    {/* Thumbnail or emoji icon */}
    {file.thumbnailLink ? (
      <img
        src={file.thumbnailLink}
        alt={file.name}
        className="w-full h-24 object-cover rounded-lg bg-white/5"
      />
    ) : (
      <span className={`text-4xl leading-none ${KIND_COLOR[file.kind]}`}>
        {KIND_EMOJI[file.kind]}
      </span>
    )}

    <div className="w-full min-w-0">
      <p className="text-[11px] font-bold text-white/70 truncate group-hover:text-white transition-colors">
        {file.name}
      </p>
      <p className="text-[9px] text-white/20 uppercase tracking-widest mt-0.5">
        {formatDriveDate(file.modifiedTime)}
      </p>
    </div>

    {/* Open in Drive link */}
    {file.webViewLink && (
      <a
        href={file.webViewLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Open in Google Drive"
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 text-white/30 hover:text-white transition-all"
      >
        <ExternalLink size={11} />
      </a>
    )}
  </button>
);

// ── File row (list) ────────────────────────────────────────────────────────────

const FileRow: React.FC<{ file: DriveFile; onClick: () => void }> = ({ file, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-transparent hover:bg-white/[0.03] hover:border-white/5 transition-all text-left"
  >
    <span className={`text-xl leading-none shrink-0 ${KIND_COLOR[file.kind]}`}>
      {KIND_EMOJI[file.kind]}
    </span>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white/70 truncate group-hover:text-white transition-colors">
        {file.name}
      </p>
      {file.owners?.[0] && (
        <p className="text-[9px] text-white/20 truncate">{file.owners[0].displayName}</p>
      )}
    </div>

    <span className="text-[10px] text-white/20 tabular-nums shrink-0 w-20 text-right">
      {formatDriveDate(file.modifiedTime)}
    </span>
    <span className="text-[10px] text-white/20 tabular-nums shrink-0 w-14 text-right">
      {formatSize(file.size)}
    </span>

    {file.webViewLink && (
      <a
        href={file.webViewLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Open in Google Drive"
        className="p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/40 transition-all shrink-0"
      >
        <ExternalLink size={13} />
      </a>
    )}
  </button>
);

// ── Page ───────────────────────────────────────────────────────────────────────

export const FilesPage: React.FC = () => {
  const { googleAccessToken } = useAppStore();

  const [tab, setTab]               = useState<TabMode>('browse');
  const [viewMode, setViewMode]     = useState<ViewMode>('grid');
  const [files, setFiles]           = useState<DriveFile[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [folderId, setFolderId]     = useState('root');
  const [breadcrumbs, setBreadcrumbs] = useState<DriveBreadcrumb[]>([]);
  const [search, setSearch]         = useState('');
  const [searchResults, setSearchResults] = useState<DriveFile[] | null>(null);
  const [searching, setSearching]   = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load folder ──────────────────────────────────────────────────────────────

  const loadFolder = useCallback(async (id: string) => {
    if (!googleAccessToken) return;
    setLoading(true);
    setError(null);
    setNeedsReauth(false);
    setSearchResults(null);
    setSearch('');
    try {
      const data = await listDriveFiles(googleAccessToken, id);
      setFiles(data);
      setFolderId(id);
    } catch (err: unknown) {
      console.error(err);
      const status = (err as { status?: number }).status;
      if (status === 403 || status === 401) {
        setNeedsReauth(true);
      } else {
        setError('Could not load folder. Check your Google Drive connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [googleAccessToken]);

  // ── Load recent ──────────────────────────────────────────────────────────────

  const loadRecent = useCallback(async () => {
    if (!googleAccessToken) return;
    setLoading(true);
    setError(null);
    setNeedsReauth(false);
    try {
      const data = await listRecentDriveFiles(googleAccessToken);
      setFiles(data);
    } catch (err: unknown) {
      console.error(err);
      const status = (err as { status?: number }).status;
      if (status === 403 || status === 401) {
        setNeedsReauth(true);
      } else {
        setError('Could not load recent files.');
      }
    } finally {
      setLoading(false);
    }
  }, [googleAccessToken]);

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!googleAccessToken) return;
    if (tab === 'browse') {
      loadFolder('root');
    } else {
      loadRecent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleAccessToken, tab]);

  // ── Search (debounced 400ms) ─────────────────────────────────────────────────

  useEffect(() => {
    if (!googleAccessToken) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!search.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchDriveFiles(googleAccessToken, search.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Navigate into a folder ───────────────────────────────────────────────────

  const handleFileClick = async (file: DriveFile) => {
    if (file.kind === 'folder') {
      // Navigate in
      const newCrumbs = [...breadcrumbs, { id: file.id, name: file.name }];
      setBreadcrumbs(newCrumbs);
      await loadFolder(file.id);
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
    }
  };

  // ── Breadcrumb navigation ────────────────────────────────────────────────────

  const navigateTo = async (index: number) => {
    if (index === -1) {
      // Root
      setBreadcrumbs([]);
      await loadFolder('root');
    } else {
      const target = breadcrumbs[index];
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      await loadFolder(target.id);
    }
  };

  // ── Displayed files (search overrides browse) ─────────────────────────────

  const displayed = searchResults ?? files;

  // ── Not connected ─────────────────────────────────────────────────────────────

  if (!googleAccessToken) {
    return (
      <div className="animate-in fade-in duration-500 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Cloud size={32} className="text-white/20" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">
            Connect Google Drive
          </h3>
          <p className="text-xs text-white/30 leading-relaxed mb-6">
            Sign in with Google to browse, search, and open your Drive files directly from PacePilot.
          </p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest">
            Sign out and back in with Google to grant Drive access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-6">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tab toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0">
          <button
            onClick={() => setTab('browse')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'browse' ? 'bg-pilot-orange text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            <FolderOpen size={13} /> My Drive
          </button>
          <button
            onClick={() => setTab('recent')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'recent' ? 'bg-pilot-orange text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            <Clock size={13} /> Recent
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          {searching && (
            <Loader size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 animate-spin" />
          )}
          <input
            type="text"
            placeholder="Search all files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${THEME.input} w-full pl-9 pr-9 py-2.5 text-sm`}
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => tab === 'browse' ? loadFolder(folderId) : loadRecent()}
          disabled={loading}
          title="Refresh"
          className={`${THEME.buttonSecondary} p-2.5 rounded-xl`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* View toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
            title="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
            title="List view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ── Breadcrumb (browse mode only) ───────────────────────────────────── */}
      {tab === 'browse' && !searchResults && (
        <nav className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => navigateTo(-1)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-pilot-orange transition-colors"
          >
            <Home size={12} /> My Drive
          </button>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={12} className="text-white/15 shrink-0" />
              <button
                onClick={() => navigateTo(i)}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors max-w-[200px] truncate ${
                  i === breadcrumbs.length - 1
                    ? 'text-white'
                    : 'text-white/30 hover:text-pilot-orange'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Search context label */}
      {searchResults && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Search results for
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-pilot-orange">
            "{search}"
          </span>
          <button
            onClick={() => { setSearch(''); setSearchResults(null); }}
            className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors ml-2"
          >
            Clear ×
          </button>
        </div>
      )}

      {/* ── Re-auth prompt (403 / missing Drive scope) ──────────────────────── */}
      {needsReauth && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-6 py-5 flex items-start gap-4">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-300 mb-1">Drive access not granted</p>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              PacePilot doesn't have permission to read your Google Drive yet.
              Sign out and sign back in with Google to grant the Drive scope, then return here.
            </p>
            <a
              href="/#/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            >
              Go to Settings → Sign out &amp; reconnect Google
            </a>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && !needsReauth && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle size={16} />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && !error && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
          : 'space-y-1'
        }>
          {Array.from({ length: viewMode === 'grid' ? 12 : 8 }).map((_, i) => (
            <div
              key={i}
              className={`animate-pulse bg-white/[0.03] rounded-xl border border-white/5 ${
                viewMode === 'grid' ? 'h-32' : 'h-12'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── File list ───────────────────────────────────────────────────────── */}
      {!loading && !error && !needsReauth && (
        <>
          {displayed.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-white/5 rounded-xl">
              <FolderOpen size={40} className="mx-auto mb-4 text-white/5" />
              <p className="text-sm font-black text-white/20 uppercase tracking-widest">
                {search ? 'No files found' : 'This folder is empty'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayed.map((file) => (
                <FileCard key={file.id} file={file} onClick={() => handleFileClick(file)} />
              ))}
            </div>
          ) : (
            /* List view with column headers */
            <div className={THEME.card}>
              {/* Header */}
              <div className="flex items-center gap-4 px-4 pb-3 border-b border-white/5 mb-1">
                <span className="w-6 shrink-0" />
                <span className="flex-1 text-[9px] font-black uppercase tracking-widest text-white/20">Name</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 w-20 text-right">Modified</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 w-14 text-right">Size</span>
                <span className="w-7 shrink-0" />
              </div>
              {displayed.map((file) => (
                <FileRow key={file.id} file={file} onClick={() => handleFileClick(file)} />
              ))}
            </div>
          )}

          {/* Count */}
          {displayed.length > 0 && (
            <p className="text-[9px] text-white/20 text-center font-bold uppercase tracking-widest">
              {displayed.length} item{displayed.length !== 1 ? 's' : ''}
              {searchResults ? ' found' : ''}
            </p>
          )}
        </>
      )}
    </div>
  );
};
