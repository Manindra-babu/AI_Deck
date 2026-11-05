import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Lock,
  Unlock,
  Building2,
  Layers
} from 'lucide-react';
import { ModelRelease } from '../types';
import { apiFetch } from '../api/client';
import { EmptyState } from '../components/EmptyState';

export const ModelsTracker: React.FC = () => {
  const [models, setModels] = useState<ModelRelease[]>([]);
  const [search, setSearch] = useState('');
  const [openSourceOnly, setOpenSourceOnly] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('All Organizations');
  const [isLoading, setIsLoading] = useState(true);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (openSourceOnly) params.append('is_open_source', 'true');
      if (selectedOrg !== 'All Organizations') params.append('organization', selectedOrg);

      const data = await apiFetch<ModelRelease[]>(`/models?${params.toString()}`);
      setModels(data || []);
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [openSourceOnly, selectedOrg]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchModels();
  };

  // Distinct organizations from current list
  const orgList = ['All Organizations', ...Array.from(new Set(models.map((m) => m.organization).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-4">
        <div>
          <h1 className="text-lg font-bold text-primary-text">AI Models Tracker</h1>
          <p className="text-xs text-secondary-text">
            Track confirmed foundation models, weights availability, architecture capabilities, and official releases. Zero hallucinated benchmarks.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by model name, organization, or capability keywords..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded bg-white text-primary-text focus:outline-none focus:ring-1 focus:ring-primary-accent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-accent hover:bg-primary-accent-hover text-white rounded text-xs font-semibold shadow-sm transition"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-secondary-text" />
            <span className="text-secondary-text font-medium">Organization:</span>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="text-xs border border-border rounded px-2.5 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
            >
              {orgList.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={openSourceOnly}
              onChange={(e) => setOpenSourceOnly(e.target.checked)}
              className="rounded text-primary-accent focus:ring-primary-accent w-3.5 h-3.5"
            />
            <span className="text-xs text-secondary-text font-medium">Open-source / Open-weights only</span>
          </label>
        </div>
      </div>

      {/* Model Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white border border-border rounded-md animate-pulse" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No Tracked Model Releases Recorded"
          description="Model announcements discovered through verified incoming company feeds and papers will be indexed here automatically."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m) => (
            <div
              key={m.id}
              className="bg-surface border border-border hover:border-slate-300 rounded-md p-4 flex flex-col justify-between shadow-subtle transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-secondary-text">{m.organization}</span>
                  {m.is_open_source ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Unlock className="w-3 h-3" />
                      <span>Open Weights</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                      <Lock className="w-3 h-3" />
                      <span>Proprietary</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-primary-text mb-2 tracking-tight">
                  {m.model_name}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {m.capabilities || 'Capabilities verified from official announcement.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {m.announcement_date ? new Date(m.announcement_date).toLocaleDateString() : 'Recent release'}
                </span>

                <div className="flex items-center gap-3">
                  {m.documentation_url && (
                    <a
                      href={m.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary-text hover:text-primary-accent inline-flex items-center gap-1 text-[11px]"
                      title="Documentation"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Docs</span>
                    </a>
                  )}
                  <a
                    href={m.announcement_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-accent font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Announcement</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
