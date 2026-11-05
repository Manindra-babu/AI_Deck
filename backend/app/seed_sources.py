"""
Initial verified AI news sources with validated RSS feed endpoints.
"""

INITIAL_SOURCES = [
    # Official AI Company Announcements
    {
        "name": "Google AI Blog",
        "website_url": "https://blog.google/technology/ai/",
        "feed_url": "https://blog.google/technology/ai/rss/",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "Google DeepMind",
        "website_url": "https://deepmind.google/blog/",
        "feed_url": "https://deepmind.google/blog/rss.xml",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "OpenAI News",
        "website_url": "https://openai.com/news/",
        "feed_url": "https://openai.com/news/rss.xml",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "Anthropic News",
        "website_url": "https://www.anthropic.com/news",
        "feed_url": "https://www.anthropic.com/news/rss",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "Hugging Face Blog",
        "website_url": "https://huggingface.co/blog",
        "feed_url": "https://huggingface.co/blog/feed.xml",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "NVIDIA Blog - AI",
        "website_url": "https://blogs.nvidia.com/",
        "feed_url": "https://blogs.nvidia.com/feed/",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "Microsoft AI Blog",
        "website_url": "https://blogs.microsoft.com/ai/",
        "feed_url": "https://blogs.microsoft.com/ai/feed/",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    {
        "name": "Mistral AI News",
        "website_url": "https://mistral.ai/news/",
        "feed_url": "https://mistral.ai/news/index.xml",
        "source_type": "Official Announcement",
        "reliability_tier": "Official source",
    },
    # Academic & Research Sources
    {
        "name": "arXiv cs.AI (Artificial Intelligence)",
        "website_url": "https://arxiv.org/list/cs.AI/recent",
        "feed_url": "https://export.arxiv.org/rss/cs.AI",
        "source_type": "Academic Paper",
        "reliability_tier": "Academic source",
    },
    {
        "name": "arXiv cs.LG (Machine Learning)",
        "website_url": "https://arxiv.org/list/cs.LG/recent",
        "feed_url": "https://export.arxiv.org/rss/cs.LG",
        "source_type": "Academic Paper",
        "reliability_tier": "Academic source",
    },
    {
        "name": "arXiv cs.CL (Computation and Language)",
        "website_url": "https://arxiv.org/list/cs.CL/recent",
        "feed_url": "https://export.arxiv.org/rss/cs.CL",
        "source_type": "Academic Paper",
        "reliability_tier": "Academic source",
    },
    # Established Technology Journalism
    {
        "name": "MIT Technology Review - AI",
        "website_url": "https://www.technologyreview.com/",
        "feed_url": "https://www.technologyreview.com/feed/",
        "source_type": "Established Publication",
        "reliability_tier": "Established publication",
    },
    {
        "name": "TechCrunch - AI",
        "website_url": "https://techcrunch.com/category/artificial-intelligence/",
        "feed_url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "source_type": "Established Publication",
        "reliability_tier": "Established publication",
    },
    {
        "name": "The Verge - AI",
        "website_url": "https://www.theverge.com/ai-artificial-intelligence",
        "feed_url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        "source_type": "Established Publication",
        "reliability_tier": "Established publication",
    },
    {
        "name": "VentureBeat - AI",
        "website_url": "https://venturebeat.com/category/ai/",
        "feed_url": "https://venturebeat.com/category/ai/feed/",
        "source_type": "Established Publication",
        "reliability_tier": "Established publication",
    },
]
