import React, { useMemo, useState } from 'react';
import type { PostStatus, Project, SocialPost } from '../types/workspace';
import { PlatformIcon, StatusLabel } from './PlatformIcon';
import { resolveMediaUrl } from '../assets/media';
import { Check, MessageSquare, RotateCcw, Send } from 'lucide-react';

interface ApprovalsViewProps {
  project: Project;
  posts: SocialPost[];
  onTransitionStatus: (
    postId: string,
    status: PostStatus,
    commentBody?: string
  ) => Promise<void>;
  onAddComment: (postId: string, body: string) => Promise<void>;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  project,
  posts,
  onTransitionStatus,
  onAddComment,
}) => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [commentInput, setCommentInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const visiblePosts = useMemo(() => {
    if (filter === 'pending') {
      return posts.filter(
        (p) => p.status === 'In Review' || p.status === 'Changes Requested'
      );
    }
    if (filter === 'approved') {
      return posts.filter((p) => p.status === 'Approved' || p.status === 'Scheduled');
    }
    return posts;
  }, [posts, filter]);

  const activePost =
    visiblePosts.find((p) => p.id === selectedId) ?? visiblePosts[0] ?? null;

  const handleAction = async (status: PostStatus) => {
    if (!activePost) return;
    setBusy(true);
    try {
      await onTransitionStatus(activePost.id, status, commentInput.trim() || undefined);
      setCommentInput('');
    } finally {
      setBusy(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentInput.trim()) return;
    setBusy(true);
    try {
      await onAddComment(activePost.id, commentInput.trim());
      setCommentInput('');
    } finally {
      setBusy(false);
    }
  };

  const avatarUrl = resolveMediaUrl('avatar_team_lead');

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Team Approval Workflows
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review creative drafts, leave feedback threads, and approve posts directly into {project.name}'s publishing queue.
          </p>
        </div>

        <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius shrink-0">
          {([
            { id: 'pending', label: 'Awaiting Review' },
            { id: 'approved', label: 'Approved & Scheduled' },
            { id: 'all', label: 'All Posts' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="theme-surface border brand-radius-lg py-16 text-center">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No posts in this approval stage.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit a draft from the Calendar or Composer to begin a review thread.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Queue List */}
          <div className="lg:col-span-5 theme-surface border brand-radius-lg divide-y theme-divider self-start overflow-hidden">
            {visiblePosts.map((post) => {
              const selected = activePost?.id === post.id;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer ${
                    selected
                      ? 'brand-accent-soft-bg'
                      : 'hover:bg-white/40 dark:hover:bg-slate-800/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusLabel status={post.status} />
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {post.scheduledAt.slice(0, 10)}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1.5">
                    {post.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      {post.platforms.map((pid) => (
                        <PlatformIcon key={pid} platform={pid} size={13} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {post.assignee} · {post.comments.length} note{post.comments.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Review & Comment Workspace */}
          {activePost && (
            <div className="lg:col-span-7 theme-surface border brand-radius-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b theme-divider pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <StatusLabel status={activePost.status} />
                    <span aria-hidden="true">·</span>
                    <span>{activePost.format}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Target: {new Date(activePost.scheduledAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                    {activePost.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAction('Changes Requested')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 brand-radius cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Request Changes
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAction('Scheduled')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 brand-radius cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Approve & Schedule
                  </button>
                </div>
              </div>

              {/* Creative Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolveMediaUrl(activePost.mediaKey) ? (
                  <img
                    src={resolveMediaUrl(activePost.mediaKey)}
                    alt={activePost.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-56 object-cover brand-radius border theme-divider"
                  />
                ) : (
                  <div className="w-full h-56 theme-surface-soft border brand-radius flex items-center justify-center text-xs text-slate-400">
                    Text-only post
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Caption Copy
                    </h3>
                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                      {activePost.caption}
                    </p>
                  </div>
                  {activePost.hashtags.length > 0 && (
                    <p className="text-xs brand-accent-text">
                      {activePost.hashtags.join(' ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    {activePost.platforms.map((pid) => (
                      <PlatformIcon key={pid} platform={pid} size={14} showLabel />
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-Time Review Thread */}
              <div className="border-t theme-divider pt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  Approval Activity Thread ({activePost.comments.length})
                </div>

                {activePost.comments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No review notes yet. Add a comment or approve directly.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activePost.comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={c.authorName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {c.authorName}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {c.authorRole}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                            {c.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
                  <label htmlFor="approval-comment" className="sr-only">
                    Add review comment
                  </label>
                  <input
                    id="approval-comment"
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add review feedback or approval note..."
                    className="flex-1 px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                  />
                  <button
                    type="submit"
                    disabled={busy || !commentInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    Comment
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
