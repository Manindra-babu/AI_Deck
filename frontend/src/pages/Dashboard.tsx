import React from 'react';
import {
  FileText,
  Flame,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Bookmark,
  CheckCircle,
  Database,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { DashboardSummary, Article } from '../types';
import { SourceBadge } from '../components/SourceBadge';
import { ImportanceBadge } from '../components/ImportanceBadge';
import { VerificationBadge } from '../components/VerificationBadge';
import { EmptyState } from '../components/EmptyState';

interface Props {
  summary: DashboardSummary | null;
  isLoading: boolean;
  onNavigateTab: (tab: string) => void;
  onToggleBookmark: (articleId: string) => void;
  onToggleRead: (articleId: string) => void;
}

export const Dashboard: React.FC<Props> = ({
  summary,
  isLoading,
  onNavigateTab,
  onToggleBookmark,
  onToggleRead,
}) => {
  if (isLoading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white border border-border rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white border border-border rounded-md" />
          ))}
        </div>
        <div className="h-96 bg-white border border-border rounded-md" />
      </div>
    );
  }

  const metrics = summary?.metrics || {
    total_articles: 0,
    active_sources: 0,
    models_tracked: 0,
    research_papers: 0,
  };

  const breakingNews = summary?.breaking_news || [];
  const latestNews = summary?.latest_news || [];
  const todayBrief = summary?.today_brief;
  const categoryCounts = summary?.category_counts || {};

  return (
    <div className="space-y-6">
      {/* Real Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-md p-4 shadow-subtle">
          <div className="flex items-center justify-between text-secondary-text text-xs font-medium mb-1">
            <span>Verified Articles</span>
            <Database className="w-4 h-4 text-primary-accent" />
          </div>
          <div className="text-2xl font-bold text-primary-text">{metrics.total_articles}</div>
          <p className="text-[11px] text-muted-text mt-1">Deduplicated & indexed</p>
        </div>

        <div className="bg-surface border border-border rounded-md p-4 shadow-subtle">
          <div className="flex items-center justify-between text-secondary-text text-xs font-medium mb-1">
            <span>Active Sources</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-primary-text">{metrics.active_sources}</div>
          <p className="text-[11px] text-muted-text mt-1">Official & Academic feeds</p>
        </div>

        <div className="bg-surface border border-border rounded-md p-4 shadow-subtle">
          <div className="flex items-center justify-between text-secondary-text text-xs font-medium mb-1">
            <span>AI Models Tracked</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-primary-text">{metrics.models_tracked}</div>
          <p className="text-[11px] text-muted-text mt-1">Confirmed announcements</p>
        </div>

        <div className="bg-surface border border-border rounded-md p-4 shadow-subtle">
          <div className="flex items-center justify-between text-secondary-text text-xs font-medium mb-1">
            <span>Research Papers</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-primary-text">{metrics.research_papers}</div>
          <p className="text-[11px] text-muted-text mt-1">arXiv preprints & lab papers</p>
        </div>
      </div>

      {/* Today's Intelligence Brief Spotlight */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-border gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-50 text-primary-accent">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary-text uppercase tracking-wide">
                Today's AI Intelligence Brief
              </h2>
              <span className="text-xs text-secondary-text">
                {todayBrief ? `Report Date: ${todayBrief.date}` : 'Daily automated synthesis'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('brief')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-accent hover:text-primary-accent-hover self-start sm:self-auto"
          >
            <span>Read Full Brief</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayBrief && todayBrief.executive_summary ? (
          <div>
            <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 mb-3">
              {todayBrief.executive_summary}
            </p>
            <div className="flex items-center gap-4 text-xs text-secondary-text">
              <span className="font-medium text-slate-900">
                {todayBrief.top_developments_count} verified developments
              </span>
              <span>&bull;</span>
              <span>Delivered via Hostinger SMTP at 07:00 AM IST</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-secondary-text mb-3">
              No daily report has been synthesized yet today. You can generate one from verified incoming articles or wait for the 07:00 AM IST schedule.
            </p>
            <button
              onClick={() => onNavigateTab('brief')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-accent bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open Intelligence Brief Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Two Column Layout: Breaking News & Category Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breaking / High Importance Developments (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">
                High-Importance Developments
              </h3>
            </div>
            <span className="text-xs text-secondary-text">Rated &ge; 7.0 by significance</span>
          </div>

          {breakingNews.length === 0 ? (
            <EmptyState
              title="No High-Impact Developments Yet"
              description="Articles with an importance score &ge; 7.0 will appear here as they are collected and verified."
            />
          ) : (
            <div className="space-y-3">
              {breakingNews.map((article) => (
                <div
                  key={article.id}
                  className="bg-surface border border-border hover:border-slate-300 rounded-md p-4 transition shadow-subtle"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <SourceBadge tier={article.credibility_assessment} sourceName={article.source_name} />
                    <VerificationBadge status={article.verification_status} />
                    <ImportanceBadge score={article.importance_score} reason={article.importance_reason} />
                    <span className="text-[11px] text-muted-text ml-auto">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-primary-text mb-1 hover:text-primary-accent">
                    <a href={article.original_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-1">
                      <span>{article.title}</span>
                      <ExternalLink className="w-3 h-3 text-secondary-text shrink-0" />
                    </a>
                  </h4>

                  {article.ai_summary && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {article.ai_summary}
                    </p>
                  )}

                  {article.why_it_matters && (
                    <div className="bg-slate-50 border-l-2 border-primary-accent px-2.5 py-1.5 rounded-r text-[11px] text-slate-700 mb-3">
                      <strong className="text-primary-accent font-semibold">Why it matters: </strong>
                      {article.why_it_matters}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                      {article.category}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleBookmark(article.id)}
                        className={`text-slate-400 hover:text-primary-accent ${
                          article.is_bookmarked ? 'text-primary-accent' : ''
                        }`}
                        title={article.is_bookmarked ? 'Remove bookmark' : 'Bookmark article'}
                      >
                        <Bookmark className="w-3.5 h-3.5" fill={article.is_bookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <a
                        href={article.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-accent font-semibold inline-flex items-center gap-1 hover:underline text-xs"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Categories Breakdown & System Sync */}
        <div className="space-y-6">
          {/* Categories Breakdown */}
          <div className="bg-surface border border-border rounded-md p-4 shadow-subtle">
            <h3 className="text-xs font-bold text-primary-text uppercase tracking-wide mb-3 flex items-center justify-between">
              <span>Category Distribution</span>
              <Layers className="w-3.5 h-3.5 text-secondary-text" />
            </h3>
            {Object.keys(categoryCounts).length === 0 ? (
              <p className="text-xs text-secondary-text py-2">No category data available.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => onNavigateTab('news')}
                    className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-slate-50 transition text-left"
                  >
                    <span className="text-slate-700 truncate max-w-[170px]">{cat}</span>
                    <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Collection Health Card */}
          <div className="bg-surface border border-border rounded-md p-4 shadow-subtle">
            <h3 className="text-xs font-bold text-primary-text uppercase tracking-wide mb-3 flex items-center justify-between">
              <span>Collection Engine Status</span>
              <Radio className="w-3.5 h-3.5 text-success" />
            </h3>
            <div className="space-y-2.5 text-xs text-secondary-text">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span>Scheduler Frequency</span>
                <span className="font-medium text-slate-800">Every 15 min</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span>Next Daily Dispatch</span>
                <span className="font-medium text-primary-accent">07:00 AM IST</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span>Engine Ingestion</span>
                <span className="font-medium text-success inline-flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-success" />
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Verified AI News Feed */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-accent" />
            <h3 className="text-sm font-bold text-primary-text uppercase tracking-wide">
              Recently Ingested News Stream
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('news')}
            className="text-xs font-semibold text-primary-accent hover:underline inline-flex items-center gap-1"
          >
            <span>Explore All in News Explorer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestNews.length === 0 ? (
          <EmptyState
            title="No Verified Articles Available"
            description="Run an ingestion cycle or add valid RSS feeds in Source Management to populate the platform."
          />
        ) : (
          <div className="divide-y divide-border">
            {latestNews.map((article) => (
              <div key={article.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 px-2 rounded transition">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-primary-accent">{article.source_name}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[11px] text-muted-text">{article.category}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[11px] text-muted-text">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-primary-text truncate hover:text-primary-accent">
                    <a href={article.original_url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h5>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ImportanceBadge score={article.importance_score} compact />
                  <a
                    href={article.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-primary-accent"
                    title="Open original source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
