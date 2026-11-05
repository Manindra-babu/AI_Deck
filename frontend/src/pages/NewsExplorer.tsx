import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Copy,
  Layers,
  ArrowUpDown,
  X
} from 'lucide-react';
import { Article } from '../types';
import { apiFetch } from '../api/client';
import { SourceBadge } from '../components/SourceBadge';
import { ImportanceBadge } from '../components/ImportanceBadge';
import { VerificationBadge } from '../components/VerificationBadge';
import { EmptyState } from '../components/EmptyState';

const CATEGORIES = [
  'All Categories',
  'Model Releases',
  'AI Research',
  'Open Source',
  'Agents',
  'Multimodal AI',
  'Robotics',
  'Infrastructure and Hardware',
  'AI Safety',
  'AI Policy',
  'AI Tools',
  'AI Companies',
  'Industry Applications',
  'Other AI Developments',
];

const VERIFICATION_OPTIONS = [
  'All Statuses',
  'Confirmed announcement',
  'Research finding',
  'Company claim',
  'Reported development',
  'Unverified claim',
];

export const NewsExplorer: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedVerification, setSelectedVerification] = useState('All Statuses');
  const [minImportance, setMinImportance] = useState<string>('all');
  const [sortBy, setSortBy] = useState('published_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Modal for Article Detail & Duplicate Coverage
  const [selectedArticleDetail, setSelectedArticleDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory !== 'All Categories') params.append('category', selectedCategory);
      if (selectedVerification !== 'All Statuses') params.append('verification_status', selectedVerification);
      if (minImportance !== 'all') params.append('min_importance', minImportance);
      if (bookmarkedOnly) params.append('is_bookmarked', 'true');
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      params.append('page', page.toString());
      params.append('page_size', '15');

      const data = await apiFetch<{ total: number; articles: Article[]; total_pages: number }>(
        `/articles?${params.toString()}`
      );
      setArticles(data.articles || []);
      setTotalCount(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to query articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedVerification, minImportance, sortBy, sortOrder, bookmarkedOnly, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleToggleBookmark = async (articleId: string) => {
    try {
      await apiFetch(`/articles/${articleId}/bookmark`, { method: 'PATCH' });
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, is_bookmarked: !a.is_bookmarked } : a))
      );
      if (selectedArticleDetail && selectedArticleDetail.article.id === articleId) {
        setSelectedArticleDetail({
          ...selectedArticleDetail,
          article: {
            ...selectedArticleDetail.article,
            is_bookmarked: !selectedArticleDetail.article.is_bookmarked,
          },
        });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleToggleRead = async (articleId: string) => {
    try {
      await apiFetch(`/articles/${articleId}/read`, { method: 'PATCH' });
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, is_read: !a.is_read } : a))
      );
    } catch (err) {
      console.error('Failed to toggle read:', err);
    }
  };

  const handleOpenDetailModal = async (articleId: string) => {
    setIsLoadingDetail(true);
    try {
      const data = await apiFetch(`/articles/${articleId}`);
      setSelectedArticleDetail(data);
    } catch (err) {
      console.error('Failed to load article detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-4">
        <div>
          <h1 className="text-lg font-bold text-primary-text">News Explorer</h1>
          <p className="text-xs text-secondary-text">
            Search, filter, inspect primary source attributions, and analyze multi-source duplicates across AI developments.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, architecture, company, model, or methodology..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded bg-white text-primary-text focus:outline-none focus:ring-1 focus:ring-primary-accent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-accent hover:bg-primary-accent-hover text-white rounded text-xs font-semibold shadow-sm transition"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-secondary-text font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-border rounded px-2.5 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-secondary-text font-medium">Status:</span>
            <select
              value={selectedVerification}
              onChange={(e) => {
                setSelectedVerification(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-border rounded px-2.5 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
            >
              {VERIFICATION_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Importance Threshold */}
          <div className="flex items-center gap-1.5">
            <span className="text-secondary-text font-medium">Min Score:</span>
            <select
              value={minImportance}
              onChange={(e) => {
                setMinImportance(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-border rounded px-2.5 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
            >
              <option value="all">All Scores</option>
              <option value="6.0">&ge; 6.0 (Notable)</option>
              <option value="7.5">&ge; 7.5 (High Impact)</option>
              <option value="8.5">&ge; 8.5 (Critical)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-secondary-text" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="text-xs border border-border rounded px-2.5 py-1.5 bg-white text-primary-text focus:ring-1 focus:ring-primary-accent"
            >
              <option value="published_at-desc">Latest Published First</option>
              <option value="published_at-asc">Oldest Published First</option>
              <option value="importance_score-desc">Highest Importance First</option>
            </select>
          </div>

          {/* Bookmark filter toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={bookmarkedOnly}
              onChange={(e) => setBookmarkedOnly(e.target.checked)}
              className="rounded text-primary-accent focus:ring-primary-accent w-3.5 h-3.5"
            />
            <span className="text-xs text-secondary-text font-medium">Bookmarked only</span>
          </label>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-secondary-text px-1">
        <span>
          Showing <strong className="text-primary-text font-semibold">{articles.length}</strong> of{' '}
          <strong className="text-primary-text font-semibold">{totalCount}</strong> verified articles
        </span>
        {totalPages > 1 && (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Articles Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-white border border-border rounded-md animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Verified Articles Match Criteria"
          description="Try broadening your search query or selecting a different category/status filter."
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`bg-surface border rounded-md p-4 transition shadow-subtle hover:border-slate-300 ${
                article.is_read ? 'opacity-85 bg-slate-50/40' : ''
              } border-border`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <SourceBadge tier={article.credibility_assessment} sourceName={article.source_name} />
                <VerificationBadge status={article.verification_status} />
                <ImportanceBadge score={article.importance_score} reason={article.importance_reason} />
                <span className="text-[11px] text-muted-text ml-auto">
                  {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-primary-text mb-1 hover:text-primary-accent">
                <button
                  onClick={() => handleOpenDetailModal(article.id)}
                  className="text-left font-bold hover:underline"
                >
                  {article.title}
                </button>
              </h3>

              <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {article.ai_summary || article.raw_summary || 'No summary text available.'}
              </p>

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
                    onClick={() => handleToggleRead(article.id)}
                    className={`text-slate-400 hover:text-primary-accent text-xs inline-flex items-center gap-1 ${
                      article.is_read ? 'text-slate-600 font-semibold' : ''
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{article.is_read ? 'Read' : 'Mark Read'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleBookmark(article.id)}
                    className={`text-slate-400 hover:text-primary-accent ${
                      article.is_bookmarked ? 'text-primary-accent' : ''
                    }`}
                    title={article.is_bookmarked ? 'Remove bookmark' : 'Bookmark article'}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={article.is_bookmarked ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={() => handleOpenDetailModal(article.id)}
                    className="text-primary-accent hover:underline text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <span>Inspect Details</span>
                  </button>

                  <a
                    href={article.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary-accent"
                    title="Open original publication"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded text-xs font-medium border border-border bg-white text-primary-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Previous
          </button>
          <span className="text-xs text-secondary-text font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded text-xs font-medium border border-border bg-white text-primary-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal: Deep Article Inspection & Duplicate Coverage */}
      {selectedArticleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <SourceBadge tier={selectedArticleDetail.article.credibility_assessment} sourceName={selectedArticleDetail.article.source_name} />
                  <VerificationBadge status={selectedArticleDetail.article.verification_status} />
                  <ImportanceBadge score={selectedArticleDetail.article.importance_score} reason={selectedArticleDetail.article.importance_reason} />
                </div>
                <h2 className="text-base font-bold text-primary-text">{selectedArticleDetail.article.title}</h2>
              </div>
              <button
                onClick={() => setSelectedArticleDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedArticleDetail.article.ai_summary && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Verified Summary</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{selectedArticleDetail.article.ai_summary}</p>
              </div>
            )}

            {selectedArticleDetail.article.why_it_matters && (
              <div className="bg-blue-50/70 p-3 rounded border border-blue-100 text-xs">
                <strong className="text-primary-accent block font-semibold mb-1">Why It Matters:</strong>
                <span className="text-slate-800 leading-relaxed">{selectedArticleDetail.article.why_it_matters}</span>
              </div>
            )}

            {selectedArticleDetail.article.technical_implications && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                <strong className="text-slate-800 block font-semibold mb-1">Technical Implications:</strong>
                <span className="text-slate-700 leading-relaxed">{selectedArticleDetail.article.technical_implications}</span>
              </div>
            )}

            {/* Duplicate Coverage / Related Coverage */}
            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-secondary-text" />
                <span>Duplicate / Multi-Source Coverage Detected</span>
              </h4>
              {selectedArticleDetail.duplicate_coverage.length === 0 ? (
                <p className="text-xs text-secondary-text">No duplicate coverage detected across other configured sources.</p>
              ) : (
                <div className="space-y-2">
                  {selectedArticleDetail.duplicate_coverage.map((dup: any) => (
                    <div key={dup.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-primary-text block">{dup.title}</span>
                        <span className="text-[11px] text-secondary-text">{dup.source_name}</span>
                      </div>
                      <a
                        href={dup.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-accent hover:underline inline-flex items-center gap-1 shrink-0 ml-2 font-medium"
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <a
                href={selectedArticleDetail.article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-accent hover:bg-primary-accent-hover text-white text-xs font-semibold rounded shadow-sm transition"
              >
                <span>Read Full Original Article</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedArticleDetail(null)}
                className="px-3 py-1.5 border border-border text-xs font-medium rounded hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
