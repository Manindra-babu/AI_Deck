export interface Article {
  id: string;
  title: string;
  original_url: string;
  canonical_url?: string;
  source_name: string;
  source_domain: string;
  published_at: string | null;
  collected_at?: string | null;
  content?: string | null;
  raw_summary: string | null;
  ai_summary: string | null;
  why_it_matters: string | null;
  technical_implications: string | null;
  category: string;
  importance_score: number;
  importance_reason: string | null;
  credibility_assessment: string;
  verification_status: string;
  is_read: boolean;
  is_bookmarked: boolean;
}

export interface NewsSource {
  id: string;
  name: string;
  website_url: string;
  feed_url: string;
  source_type: string;
  reliability_tier: string;
  is_active: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  article_count: number;
}

export interface DiscoveryCandidate {
  id: string;
  domain: string;
  suggested_name: string;
  suggested_type: string;
  discovered_feed_url: string | null;
  validation_status: string;
  reliability_tier: string;
  error_details: string | null;
}

export interface ModelRelease {
  id: string;
  model_name: string;
  organization: string;
  announcement_date: string | null;
  model_category: string;
  capabilities: string | null;
  announcement_url: string;
  documentation_url: string | null;
  is_open_source: boolean;
  weights_available: boolean;
  benchmarks: string | null;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string | null;
  publication_date: string | null;
  abstract: string | null;
  category: string;
  paper_url: string;
  code_url: string | null;
  ai_explanation: string | null;
  research_significance: string | null;
}

export interface DailyReport {
  id: string;
  report_date: string;
  executive_summary: string;
  top_developments: {
    headline: string;
    what_happened: string;
    why_it_matters: string;
    technical_implications?: string;
    source_url: string;
    source_name: string;
    verification_status: string;
  }[];
  model_releases: {
    model_name: string;
    organization: string;
    details: string;
    source_url: string;
    is_open_source?: boolean;
  }[];
  research_breakthroughs: {
    title: string;
    significance: string;
    source_url: string;
  }[];
  industry_developments: {
    title: string;
    details: string;
    source_url: string;
  }[];
  open_source_developments: {
    title: string;
    details: string;
    source_url: string;
  }[];
  emerging_trends: {
    trend: string;
    evidence: string;
    significance: string;
  }[];
  total_articles_analyzed: number;
  generated_at: string | null;
}

export interface DashboardSummary {
  metrics: {
    total_articles: number;
    active_sources: number;
    models_tracked: number;
    research_papers: number;
  };
  sync_status: {
    last_collection: string | null;
    collection_status: string;
    last_articles_found: number;
    next_scheduled_brief: string;
    timezone: string;
  };
  today_brief: {
    id: string | null;
    date: string | null;
    executive_summary: string | null;
    top_developments_count: number;
  } | null;
  breaking_news: Article[];
  latest_news: Article[];
  category_counts: Record<string, number>;
}

export interface SystemHealth {
  system_status: string;
  database: {
    status: string;
    url_type: string;
  };
  gemini_api: {
    configured: boolean;
    model: string;
    status: string;
  };
  smtp: {
    configured: boolean;
    host: string;
    port: number;
  };
  last_collection: {
    status: string;
    at: string | null;
    articles_added: number;
  };
}
