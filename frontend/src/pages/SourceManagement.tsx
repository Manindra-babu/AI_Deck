import React, { useState, useEffect } from 'react';
import {
  Rss,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Compass,
  Check,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import { NewsSource, DiscoveryCandidate } from '../types';
import { apiFetch } from '../api/client';
import { SourceBadge } from '../components/SourceBadge';
import { EmptyState } from '../components/EmptyState';

export const SourceManagement: React.FC = () => {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [discoveryCandidates, setDiscoveryCandidates] = useState<DiscoveryCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Source Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState('Official Announcement');
  const [newReliabilityTier, setNewReliabilityTier] = useState('Official source');
  const [isTestingFeed, setIsTestingFeed] = useState(false);
  const [feedTestResult, setFeedTestResult] = useState<{ valid: boolean; message: string; latency_ms?: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto Discovery
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ sources: NewsSource[]; discovery_candidates: DiscoveryCandidate[] }>('/sources');
      setSources(data.sources || []);
      setDiscoveryCandidates(data.discovery_candidates || []);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleTestFeed = async () => {
    if (!newFeedUrl.trim()) return;
    setIsTestingFeed(true);
    setFeedTestResult(null);
    try {
      const res = await apiFetch<{ valid: boolean; message: string; latency_ms: number }>('/sources/test', {
        method: 'POST',
        body: JSON.stringify({ feed_url: newFeedUrl.trim() }),
      });
      setFeedTestResult(res);
    } catch (err: any) {
      setFeedTestResult({ valid: false, message: err.message || 'Validation failed' });
    } finally {
      setIsTestingFeed(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch('/sources', {
        method: 'POST',
        body: JSON.stringify({
          name: newSourceName.trim(),
          website_url: newWebsiteUrl.trim(),
          feed_url: newFeedUrl.trim(),
          source_type: newSourceType,
          reliability_tier: newReliabilityTier,
        }),
      });
      setStatusMessage({ type: 'success', text: `Source '${newSourceName}' added and verified successfully!` });
      setShowAddModal(false);
      setNewSourceName('');
      setNewWebsiteUrl('');
      setNewFeedUrl('');
      setFeedTestResult(null);
      await fetchSources();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add source.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSource = async (sourceId: string) => {
    try {
      const res = await apiFetch<{ id: string; is_active: boolean }>(`/sources/${sourceId}/toggle`, {
        method: 'PATCH',
      });
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, is_active: res.is_active } : s))
      );
    } catch (err) {
      console.error('Failed to toggle source:', err);
    }
  };

  const handleDeleteSource = async (sourceId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove '${name}'?`)) return;
    try {
      await apiFetch(`/sources/${sourceId}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      setStatusMessage({ type: 'success', text: `Source '${name}' deleted.` });
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  };

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setStatusMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; discovered_count: number }>('/sources/discover', {
        method: 'POST',
      });
      setStatusMessage({
        type: 'success',
        text: `Source discovery evaluated ${res.discovered_count} candidate feeds. Verified results updated below.`,
      });
      await fetchSources();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to run source discovery.' });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddDiscoveredCandidate = (candidate: DiscoveryCandidate) => {
    if (!candidate.discovered_feed_url) return;
    setNewSourceName(candidate.suggested_name);
    setNewWebsiteUrl(`https://${candidate.domain}`);
    setNewFeedUrl(candidate.discovered_feed_url);
    setNewSourceType(candidate.suggested_type);
    setNewReliabilityTier(candidate.reliability_tier);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Source Management</h1>
          <p className="text-xs text-secondary-text">
            Configure, validate, and monitor real-world RSS/Atom feeds across AI labs, companies, and academic publications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-primary-accent bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
          >
            <Compass className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span>{isDiscovering ? 'Discovering...' : 'Discover Candidates'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-primary-accent hover:bg-primary-accent-hover transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add RSS Source</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded text-xs border flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Configured Sources Table */}
      <div className="bg-surface border border-border rounded-md shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-primary-accent" />
            <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">
              Configured AI Sources ({sources.length})
            </h2>
          </div>
          <span className="text-xs text-secondary-text">All active feeds are polled on schedule</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-secondary-text animate-pulse">Loading sources...</div>
        ) : sources.length === 0 ? (
          <EmptyState
            icon={Rss}
            title="No Sources Configured"
            description="Add an RSS feed or run source discovery to configure primary intelligence endpoints."
            actionText="Add New Source"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-border text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Source Name</th>
                  <th className="py-2.5 px-4">Tier & Type</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Articles</th>
                  <th className="py-2.5 px-4">Last Sync</th>
                  <th className="py-2.5 px-4">Diagnostics</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-primary-text">{s.name}</div>
                      <a
                        href={s.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary-accent hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px]">{s.website_url}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <SourceBadge tier={s.reliability_tier} />
                        <span className="block text-[10px] text-muted-text">{s.source_type}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleSource(s.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{s.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{s.article_count || 0}</td>

                    <td className="py-3 px-4 text-[11px] text-secondary-text">
                      {s.last_fetched_at ? new Date(s.last_fetched_at).toLocaleTimeString() : 'Never'}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {s.last_error ? (
                        <span className="text-[11px] text-rose-600 truncate block" title={s.last_error}>
                          {s.last_error}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Healthy
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSource(s.id, s.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discovered Candidates Section */}
      {discoveryCandidates.length > 0 && (
        <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary-accent" />
              <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">
                Discovered Feed Candidates ({discoveryCandidates.length})
              </h2>
            </div>
            <span className="text-xs text-secondary-text">Provisional candidates discovered by AI research entity crawler</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {discoveryCandidates.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 border border-border rounded text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-primary-text">{c.suggested_name}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        c.validation_status === 'validated'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {c.validation_status}
                    </span>
                  </div>
                  <span className="text-[11px] text-secondary-text block truncate mb-2">{c.domain}</span>
                  <p className="text-[11px] text-slate-500 mb-3">{c.error_details || 'Evaluation details available.'}</p>
                </div>

                {c.validation_status === 'validated' && c.discovered_feed_url && (
                  <button
                    onClick={() => handleAddDiscoveredCandidate(c)}
                    className="w-full py-1 px-2 bg-white hover:bg-blue-50 border border-blue-200 text-primary-accent font-semibold rounded text-[11px] transition shadow-xs"
                  >
                    Add to Active Sources
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">Add New RSS Feed</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-3 text-xs">
              <div>
                <label className="block text-secondary-text font-medium mb-1">Source Name</label>
                <input
                  type="text"
                  required
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g. OpenAI Blog, Stanford HAI"
                  className="w-full border border-border rounded px-3 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
                />
              </div>

              <div>
                <label className="block text-secondary-text font-medium mb-1">Website URL</label>
                <input
                  type="url"
                  required
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                  placeholder="https://openai.com/news/"
                  className="w-full border border-border rounded px-3 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
                />
              </div>

              <div>
                <label className="block text-secondary-text font-medium mb-1">Feed URL (RSS or Atom)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={newFeedUrl}
                    onChange={(e) => {
                      setNewFeedUrl(e.target.value);
                      setFeedTestResult(null);
                    }}
                    placeholder="https://openai.com/news/rss.xml"
                    className="flex-1 border border-border rounded px-3 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
                  />
                  <button
                    type="button"
                    onClick={handleTestFeed}
                    disabled={isTestingFeed || !newFeedUrl.trim()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded font-semibold text-xs transition"
                  >
                    {isTestingFeed ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {feedTestResult && (
                <div
                  className={`p-2.5 rounded border text-[11px] ${
                    feedTestResult.valid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    {feedTestResult.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{feedTestResult.valid ? 'Feed Verified' : 'Feed Test Failed'}</span>
                  </div>
                  <p className="mt-0.5">{feedTestResult.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-secondary-text font-medium mb-1">Source Type</label>
                  <select
                    value={newSourceType}
                    onChange={(e) => setNewSourceType(e.target.value)}
                    className="w-full border border-border rounded px-2.5 py-1.5 bg-white text-primary-text"
                  >
                    <option value="Official Announcement">Official Announcement</option>
                    <option value="Academic Paper">Academic Paper</option>
                    <option value="Established Publication">Established Publication</option>
                    <option value="Open Source Community">Open Source Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-secondary-text font-medium mb-1">Reliability Tier</label>
                  <select
                    value={newReliabilityTier}
                    onChange={(e) => setNewReliabilityTier(e.target.value)}
                    className="w-full border border-border rounded px-2.5 py-1.5 bg-white text-primary-text"
                  >
                    <option value="Official source">Official source</option>
                    <option value="Academic source">Academic source</option>
                    <option value="Established publication">Established publication</option>
                    <option value="Community source">Community source</option>
                    <option value="Unverified source">Unverified source</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-border rounded font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary-accent hover:bg-primary-accent-hover text-white rounded font-semibold transition shadow-sm"
                >
                  {isSubmitting ? 'Adding...' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
