import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  ExternalLink,
  Code,
  Sparkles,
  BookOpen,
  Calendar,
  Users
} from 'lucide-react';
import { ResearchPaper } from '../types';
import { apiFetch } from '../api/client';
import { EmptyState } from '../components/EmptyState';

export const ResearchRadar: React.FC = () => {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPapers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page.toString());
      params.append('page_size', '15');

      const data = await apiFetch<{ total: number; papers: ResearchPaper[]; total_pages: number }>(
        `/research?${params.toString()}`
      );
      setPapers(data.papers || []);
      setTotalCount(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load research papers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPapers();
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="bg-surface border border-border rounded-md p-5 shadow-subtle space-y-4">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Research Radar</h1>
          <p className="text-xs text-secondary-text">
            Track genuine AI research preprints, laboratory publications, and breakthrough methodology from arXiv (cs.AI, cs.LG, cs.CL) and premier AI research labs.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search research papers by methodology, author, architecture, or abstract..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded bg-white text-primary-text focus:outline-none focus:ring-1 focus:ring-primary-accent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-accent hover:bg-primary-accent-hover text-white rounded text-xs font-semibold shadow-sm transition"
          >
            Search Papers
          </button>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-secondary-text px-1">
        <span>
          Showing <strong className="text-primary-text font-semibold">{papers.length}</strong> of{' '}
          <strong className="text-primary-text font-semibold">{totalCount}</strong> indexed papers
        </span>
        {totalPages > 1 && (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Research Papers List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white border border-border rounded-md animate-pulse" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Research Papers Found"
          description="arXiv (cs.AI, cs.LG, cs.CL) feeds sync automatically on collection intervals. Papers will appear here as they are retrieved."
        />
      ) : (
        <div className="space-y-4">
          {papers.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-border hover:border-slate-300 rounded-md p-5 shadow-subtle transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {p.category}
                </span>

                <div className="flex items-center gap-2 text-xs text-secondary-text">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{p.publication_date ? new Date(p.publication_date).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-primary-text mb-1 hover:text-primary-accent">
                  <a href={p.paper_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-1">
                    <span>{p.title}</span>
                    <ExternalLink className="w-3 h-3 text-secondary-text" />
                  </a>
                </h3>

                {p.authors && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <Users className="w-3.5 h-3.5" />
                    <span className="truncate max-w-xl">{p.authors}</span>
                  </div>
                )}
              </div>

              {/* AI Explanation / Significance */}
              {p.ai_explanation && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                  <strong className="text-primary-accent block font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Technical Breakdown:</span>
                  </strong>
                  <p className="text-slate-700 leading-relaxed font-sans">{p.ai_explanation}</p>
                </div>
              )}

              {p.research_significance && (
                <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100 text-xs">
                  <strong className="text-emerald-800 block font-semibold mb-0.5">Research Significance:</strong>
                  <span className="text-slate-700">{p.research_significance}</span>
                </div>
              )}

              {/* Abstract Preview */}
              {p.abstract && !p.ai_explanation && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                  {p.abstract}
                </p>
              )}

              {/* Footer Links */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-muted-text text-[11px]">Primary Source: arXiv Preprint</span>

                <div className="flex items-center gap-3">
                  {p.code_url && (
                    <a
                      href={p.code_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary-text hover:text-primary-accent inline-flex items-center gap-1 font-medium"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Code Repository</span>
                    </a>
                  )}
                  <a
                    href={p.paper_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-accent hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Read Paper on arXiv</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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
    </div>
  );
};
