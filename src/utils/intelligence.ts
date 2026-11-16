import type {
  AnalyticsPoint,
  BrandAuditInput,
  BrandAuditReport,
  CompetitorProfileSummary,
  ContentFormat,
  PerformanceForecastReport,
  PlatformId,
  SocialPost,
} from '../types/workspace.ts';
import { ALL_PLATFORMS, PLATFORM_SPECS } from './scheduler.ts';

export interface ParsedProfileUrl {
  valid: boolean;
  normalizedUrl: string;
  platform: PlatformId | 'web';
  handle: string;
  error?: string;
}

export function parseCompetitorProfileUrl(rawUrl: string): ParsedProfileUrl {
  const trimmed = rawUrl.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return {
      valid: false,
      normalizedUrl: '',
      platform: 'web',
      handle: '',
      error: 'Enter a valid social media profile URL without spaces.',
    };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      valid: false,
      normalizedUrl: '',
      platform: 'web',
      handle: '',
      error: 'Invalid URL format. Example: https://www.instagram.com/brandname',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) {
    return {
      valid: false,
      normalizedUrl: '',
      platform: 'web',
      handle: '',
      error: 'Enter a full domain URL (e.g., https://www.instagram.com/brandname).',
    };
  }
  let platform: PlatformId | 'web' = 'web';
  if (host.includes('instagram.com')) platform = 'instagram';
  else if (host.includes('linkedin.com')) platform = 'linkedin';
  else if (host.includes('tiktok.com')) platform = 'tiktok';
  else if (host.includes('twitter.com') || host.includes('x.com')) platform = 'x';
  else if (host.includes('youtube.com') || host.includes('youtu.be')) platform = 'youtube';
  else if (host.includes('pinterest.com')) platform = 'pinterest';
  else if (host.includes('facebook.com')) platform = 'facebook';

  const segments = parsed.pathname.split('/').filter(Boolean);
  let handle = segments[segments.length - 1] || parsed.hostname;
  if (segments[0] === 'company' || segments[0] === 'in' || segments[0] === 'c') {
    handle = segments[1] || handle;
  }
  handle = handle.startsWith('@') ? handle : `@${handle.replace(/^@/, '')}`;

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
    platform,
    handle,
  };
}

export interface HistoricalBaseline {
  samplePosts: number;
  avgReach: number;
  avgImpressions: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementRate: number;
  dailyAccountReachAvg: number;
}

export function computeAccountHistoricalBaseline(
  posts: SocialPost[],
  analyticsSeries: AnalyticsPoint[],
  platform: PlatformId
): HistoricalBaseline {
  const published = posts.filter((p) => p.status === 'Published' && p.metrics);
  const platformPublished = published.filter((p) => p.platforms.includes(platform));
  const pool = platformPublished.length > 0 ? platformPublished : published;

  const recentSeries = analyticsSeries.slice(-30);
  const dailyAccountReachAvg =
    recentSeries.length > 0
      ? Math.round(
          recentSeries.reduce(
            (acc, pt) => acc + (pt.platformBreakdown?.[platform] ?? Math.round(pt.reach * 0.15)),
            0
          ) / recentSeries.length
        )
      : 12000;

  if (pool.length === 0) {
    return {
      samplePosts: 0,
      avgReach: dailyAccountReachAvg,
      avgImpressions: Math.round(dailyAccountReachAvg * 1.35),
      avgLikes: Math.round(dailyAccountReachAvg * 0.042),
      avgComments: Math.round(dailyAccountReachAvg * 0.004),
      avgShares: Math.round(dailyAccountReachAvg * 0.006),
      avgEngagementRate: 5.2,
      dailyAccountReachAvg,
    };
  }

  const n = pool.length;
  const totals = pool.reduce(
    (acc, p) => {
      const m = p.metrics!;
      return {
        reach: acc.reach + m.reach,
        impressions: acc.impressions + m.impressions,
        likes: acc.likes + m.likes,
        comments: acc.comments + m.comments,
        shares: acc.shares + m.shares,
        er: acc.er + m.engagementRate,
      };
    },
    { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, er: 0 }
  );

  return {
    samplePosts: n,
    avgReach: Math.round(totals.reach / n),
    avgImpressions: Math.round(totals.impressions / n),
    avgLikes: Math.round(totals.likes / n),
    avgComments: Math.round(totals.comments / n),
    avgShares: Math.round(totals.shares / n),
    avgEngagementRate: Number((totals.er / n).toFixed(2)),
    dailyAccountReachAvg,
  };
}

export function buildForecastExportCsv(
  report: PerformanceForecastReport,
  projectName: string
): string {
  const escape = (val: string | number) => {
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: Array<Array<string | number>> = [
    ['Project', projectName],
    ['Created At', report.createdAt],
    ['Target Platform', PLATFORM_SPECS[report.platform]?.label ?? report.platform],
    ['Content Format', report.format],
    ['Content Description', report.contentDescription],
    ['Confidence Score (%)', report.confidenceScore],
    ['Predicted Reach', report.predictedReach],
    ['Predicted Likes', report.predictedLikes],
    ['Predicted Comments', report.predictedComments],
    ['Predicted Shares', report.predictedShares],
    ['Predicted Engagement Rate (%)', report.predictedEngagementRate],
    ['Optimization Summary', report.summary],
    ['Influencing Factors', report.factors.map((f) => `${f.label} (${f.impact}): ${f.detail}`).join(' | ')],
  ];

  return ['Metric,Value', ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

export function buildForecastExportMarkdown(
  report: PerformanceForecastReport,
  projectName: string
): string {
  const platformLabel = PLATFORM_SPECS[report.platform]?.label ?? report.platform;
  const factorsMd = report.factors
    .map((f) => `- **${f.label}** (${f.impact}): ${f.detail}`)
    .join('\n');

  return `# Performance Forecast Report — ${projectName}

- **Generated:** ${report.createdAt}
- **Target Platform:** ${platformLabel}
- **Format:** ${report.format}
- **Confidence Score:** ${report.confidenceScore}%

## Content Brief
${report.contentDescription}

## Predicted Metrics
| Metric | Forecast |
| --- | ---: |
| Reach | ${report.predictedReach.toLocaleString()} |
| Likes | ${report.predictedLikes.toLocaleString()} |
| Comments | ${report.predictedComments.toLocaleString()} |
| Shares | ${report.predictedShares.toLocaleString()} |
| Engagement Rate | ${report.predictedEngagementRate}% |

## Executive Summary
${report.summary}

## Influencing Factors
${factorsMd}
`;
}

export function validateBrandAuditInput(input: BrandAuditInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input.brandName.trim()) {
    errors.push('Brand name is required.');
  }
  if (!input.industry.trim()) {
    errors.push('Industry or niche is required.');
  }
  if (input.platforms.length === 0) {
    errors.push('Select at least one active social media platform.');
  }
  if (input.followersTotal < 0 || Number.isNaN(input.followersTotal)) {
    errors.push('Total followers must be zero or greater.');
  }
  if (input.postsPerMonth < 0 || Number.isNaN(input.postsPerMonth)) {
    errors.push('Monthly posting frequency must be zero or greater.');
  }
  if (input.avgEngagementRate < 0 || input.avgEngagementRate > 100) {
    errors.push('Average engagement rate must be between 0 and 100%.');
  }
  if (input.bioClarityScore < 1 || input.bioClarityScore > 10) {
    errors.push('Bio & CTA clarity rating must be between 1 and 10.');
  }
  if (input.visualConsistencyScore < 1 || input.visualConsistencyScore > 10) {
    errors.push('Visual consistency rating must be between 1 and 10.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isValidPlatform(p: string): p is PlatformId {
  return (ALL_PLATFORMS as string[]).includes(p);
}

export const SUPPORTED_IDEA_FORMATS: Array<ContentFormat | 'Infographic' | 'Short Video'> = [
  'Carousel',
  'Reel / Short',
  'Video',
  'Infographic',
  'Thread',
  'Single Post',
];

export function formatCompetitorReportMarkdown(
  competitors: CompetitorProfileSummary[],
  summaryHeadline: string
): string {
  return `${summaryHeadline}\n\n${competitors
    .map(
      (c) =>
        `${c.name} (${c.handle} · ${c.platform}): ${c.avgEngagementRate}% ER, ${c.postsPerWeek}/wk`
    )
    .join('\n')}`;
}

export function normalizeHashtag(raw: string): string {
  const cleaned = raw.trim().replace(/^#+/, '').replace(/[^a-zA-Z0-9_]/g, '');
  return cleaned ? `#${cleaned}` : '';
}

export function mergeHashtags(existingRaw: string, additions: string[]): string {
  const existing = existingRaw
    .split(/\s+/)
    .map(normalizeHashtag)
    .filter(Boolean);
  const seen = new Set(existing.map((tag) => tag.toLowerCase()));
  const result = [...existing];

  for (const raw of additions) {
    const tag = normalizeHashtag(raw);
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      result.push(tag);
    }
  }
  return result.join(' ');
}

export function getRecommendedHashtagCount(platform: PlatformId): {
  min: number;
  max: number;
  note: string;
} {
  switch (platform) {
    case 'x':
      return { min: 1, max: 2, note: 'X performs best with 1–2 concise tags within 280 chars.' };
    case 'linkedin':
      return { min: 3, max: 5, note: 'LinkedIn indexes 3–5 industry & topic tags cleanly.' };
    case 'instagram':
      return { min: 5, max: 10, note: 'Instagram rewards 5–10 mixed niche & discovery tags.' };
    case 'tiktok':
      return { min: 3, max: 6, note: 'TikTok pairs 3–6 trending + niche community tags.' };
    case 'youtube':
      return { min: 3, max: 5, note: 'YouTube Shorts & descriptions favor 3–5 searchable tags.' };
    case 'pinterest':
      return { min: 3, max: 6, note: 'Pinterest balances 3–6 seasonal & descriptive keywords.' };
    case 'facebook':
      return { min: 2, max: 4, note: 'Facebook engagement stays cleanest with 2–4 focused tags.' };
  }
}
