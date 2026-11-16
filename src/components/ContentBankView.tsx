import React, { useEffect, useState } from 'react';
import type {
  CanvaConnectionState,
  ContentAsset,
  PlatformId,
  Project,
} from '../types/workspace';
import { PLATFORM_SPECS } from '../utils/scheduler';
import { PlatformIcon } from './PlatformIcon';
import { resolveMediaUrl } from '../assets/media';
import { ExternalLink, Layers, Plus, Trash2, Upload } from 'lucide-react';

interface ContentBankViewProps {
  project: Project;
  assets: ContentAsset[];
  canva: CanvaConnectionState;
  onAddAsset: (payload: {
    title: string;
    type: 'image' | 'video' | 'template' | 'copy';
    mediaKey: string;
    dimensions: string;
    platforms: PlatformId[];
    tags: string[];
  }) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
  onConnectCanva: () => Promise<void>;
  onImportCanvaDesign: (designId: string) => Promise<void>;
  onRefreshWorkspace: () => Promise<void>;
}

export const ContentBankView: React.FC<ContentBankViewProps> = ({
  project,
  assets,
  canva,
  onAddAsset,
  onDeleteAsset,
  onConnectCanva,
  onImportCanvaDesign,
  onRefreshWorkspace,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'template'>('all');
  const [showCanvaDrawer, setShowCanvaDrawer] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'image' | 'video' | 'template'>('image');
  const [newMediaKey, setNewMediaKey] = useState('asset_skincare_serum');
  const [newDimensions, setNewDimensions] = useState('1080 × 1350 px');
  const [newTags, setNewTags] = useState('campaign, social');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [canvaMessage, setCanvaMessage] = useState<string | null>(null);

  const callbackUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/auth/canva/callback` : '';

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CANVA_OAUTH_SUCCESS') {
        setCanvaMessage('Canva OAuth workspace connected.');
        onRefreshWorkspace();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onRefreshWorkspace]);

  const filteredAssets = assets.filter((a) =>
    typeFilter === 'all' ? true : a.type === typeFilter
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewMediaKey(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddAsset({
      title: newTitle.trim(),
      type: newType,
      mediaKey: newMediaKey,
      dimensions: newDimensions,
      platforms: ['instagram', 'linkedin', 'tiktok'],
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setNewTitle('');
    setShowUploadForm(false);
  };

  const handleLaunchCanvaOAuth = async () => {
    setCanvaMessage(null);
    const resp = await fetch('/api/canva/auth-url');
    const data = (await resp.json()) as { oauthConfigured: boolean; url: string | null };
    if (data.oauthConfigured && data.url) {
      window.open(data.url, 'canva_oauth_popup', 'width=620,height=720');
      return;
    }
    // Sync studio Canva library directly when custom CANVA_CLIENT_ID is not yet set
    await onConnectCanva();
    setCanvaMessage('Connected Canva studio library. Ready to import designs into this project.');
  };

  const handleImport = async (designId: string) => {
    setImportingId(designId);
    try {
      await onImportCanvaDesign(designId);
      setCanvaMessage(`Imported Canva design into ${project.name} Content Bank.`);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Project Content Bank & Canva Connect
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Centralized creative assets, video clips, and synced Canva templates scoped to {project.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCanvaDrawer((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            Import from Canva
          </button>

          <button
            type="button"
            onClick={() => setShowUploadForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Canva Connect Integration Panel */}
      {showCanvaDrawer && (
        <section className="theme-surface border brand-radius-lg p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b theme-divider pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Canva Connect Design Library
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {canva.connected
                  ? `Connected (${canva.accountEmail ?? 'Studio Workspace'}) · Import templates directly into ${project.name}`
                  : `Connect Canva to pull brand templates and carousels into ${project.name}'s Content Bank.`}
              </p>
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                OAuth Redirect URI: {callbackUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLaunchCanvaOAuth}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                {canva.connected ? 'Sync Canva Designs' : 'Connect Canva Account'}
              </button>
            </div>
          </div>

          {canvaMessage && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {canvaMessage}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {canva.designs.map((design) => {
              const imgUrl = resolveMediaUrl(design.mediaKey);
              return (
                <div
                  key={design.id}
                  className="border theme-surface-soft brand-radius overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={design.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {design.category} · <span className="font-mono">{design.dimensions}</span>
                      </p>
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {design.title}
                      </h3>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      disabled={importingId === design.id}
                      onClick={() => handleImport(design.id)}
                      className="w-full py-1.5 px-3 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius cursor-pointer"
                    >
                      {importingId === design.id ? 'Importing...' : `Import to ${project.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Upload Asset Form */}
      {showUploadForm && (
        <form
          onSubmit={handleCreateAsset}
          className="theme-surface border brand-radius-lg p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Upload Creative Asset to {project.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="asset-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Asset Title
              </label>
              <input
                id="asset-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Holiday Gift Box Flatlay"
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              />
            </div>
            <div>
              <label htmlFor="asset-type" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Media Type
              </label>
              <select
                id="asset-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'image' | 'video' | 'template')}
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              >
                <option value="image">Image</option>
                <option value="video">Video / Reel</option>
                <option value="template">Design Template</option>
              </select>
            </div>
            <div>
              <label htmlFor="asset-dims" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dimensions
              </label>
              <input
                id="asset-dims"
                type="text"
                value={newDimensions}
                onChange={(e) => setNewDimensions(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="asset-file" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Upload Local Image File (optional)
              </label>
              <input
                id="asset-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:border file:border-slate-300 dark:file:border-slate-700 file:text-xs file:font-medium file:bg-slate-50 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:rounded"
              />
            </div>
            <div>
              <label htmlFor="asset-tags" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                id="asset-tags"
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 brand-radius cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              Save to Content Bank
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius">
          {(['all', 'image', 'video', 'template'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium capitalize brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                typeFilter === t
                  ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t === 'all' ? `All Assets (${assets.length})` : `${t}s`}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {filteredAssets.length} item{filteredAssets.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="theme-surface border brand-radius-lg py-16 text-center">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No assets in {project.name}'s Content Bank yet.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Import a design from Canva or upload a new file above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const imgUrl = resolveMediaUrl(asset.mediaKey);
            return (
              <article
                key={asset.id}
                className="theme-surface border brand-radius-lg overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={asset.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover border-b theme-divider"
                    />
                  ) : (
                    <div className="w-full h-48 theme-surface-soft flex items-center justify-center text-xs text-slate-400">
                      {asset.type}
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">
                        {asset.source === 'canva' ? 'Canva Import' : asset.source} · {asset.type}
                      </span>
                      <span className="font-mono">{asset.dimensions}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {asset.title}
                    </h3>
                    {asset.tags.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {asset.tags.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 border-t theme-divider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {asset.platforms.map((pid) => (
                      <PlatformIcon
                        key={pid}
                        platform={pid}
                        size={13}
                        className="opacity-80"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${asset.title}`}
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 brand-radius cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
