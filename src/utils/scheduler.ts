import type {
  AnalyticsPoint,
  AutoScheduleRule,
  PlatformId,
  PostStatus,
  SocialPost,
} from '../types/workspace';

export interface PlatformSpec {
  id: PlatformId;
  label: string;
  shortLabel: string;
  maxChars: number;
  requiresMedia: boolean;
  defaultFormats: string[];
  aspectHint: string;
  peakHours: number[];
  brandHex: string;
}

export const ALL_PLATFORMS: PlatformId[] = [
  'linkedin',
  'instagram',
  'facebook',
  'x',
  'youtube',
  'pinterest',
  'tiktok',
];

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    shortLabel: 'LI',
    maxChars: 3000,
    requiresMedia: false,
    defaultFormats: ['Single Post', 'Carousel', 'Article', 'Video'],
    aspectHint: '4:5 or 1.91:1',
    peakHours: [9, 12, 16],
    brandHex: '#0A66C2',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    shortLabel: 'IG',
    maxChars: 2200,
    requiresMedia: true,
    defaultFormats: ['Carousel', 'Reel / Short', 'Single Post'],
    aspectHint: '4:5 or 9:16',
    peakHours: [11, 14, 19],
    brandHex: '#E1306C',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    shortLabel: 'FB',
    maxChars: 5000,
    requiresMedia: false,
    defaultFormats: ['Single Post', 'Video', 'Reel / Short'],
    aspectHint: '16:9 or 1:1',
    peakHours: [10, 13, 18],
    brandHex: '#1877F2',
  },
  x: {
    id: 'x',
    label: 'X',
    shortLabel: 'X',
    maxChars: 280,
    requiresMedia: false,
    defaultFormats: ['Single Post', 'Thread'],
    aspectHint: '16:9',
    peakHours: [8, 12, 17],
    brandHex: '#111827',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    shortLabel: 'YT',
    maxChars: 5000,
    requiresMedia: true,
    defaultFormats: ['Video', 'Reel / Short'],
    aspectHint: '16:9 or 9:16',
    peakHours: [14, 17, 20],
    brandHex: '#FF0000',
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    shortLabel: 'PIN',
    maxChars: 500,
    requiresMedia: true,
    defaultFormats: ['Pin'],
    aspectHint: '2:3 vertical',
    peakHours: [15, 20, 21],
    brandHex: '#E60023',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TT',
    maxChars: 2200,
    requiresMedia: true,
    defaultFormats: ['Reel / Short', 'Video'],
    aspectHint: '9:16 vertical',
    peakHours: [12, 18, 21],
    brandHex: '#0F172A',
  },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePostForPlatforms(
  caption: string,
  hashtags: string[],
  platforms: PlatformId[],
  hasMedia: boolean
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (platforms.length === 0) {
    errors.push('Select at least one target social media platform.');
  }

  const trimmed = caption.trim();
  if (!trimmed) {
    errors.push('Post caption cannot be empty.');
  }

  const fullLength =
    trimmed.length + (hashtags.length > 0 ? hashtags.join(' ').length + 2 : 0);

  for (const pid of platforms) {
    const spec = PLATFORM_SPECS[pid];
    if (fullLength > spec.maxChars) {
      errors.push(
        `${spec.label} character limit exceeded (${fullLength}/${spec.maxChars} chars).`
      );
    } else if (pid === 'x' && fullLength > 240) {
      warnings.push(
        `X post is ${fullLength}/280 chars; consider tightening for higher repost velocity.`
      );
    }
    if (spec.requiresMedia && !hasMedia) {
      warnings.push(
        `${spec.label} performs best with attached media (${spec.aspectHint}).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export interface AutoScheduleOutcome {
  updatedPosts: SocialPost[];
  scheduledCount: number;
  slotAssignments: Array<{ postId: string; title: string; scheduledAt: string }>;
}

/**
 * Pure deterministic automated scheduling algorithm.
 * Finds conflict-free peak-hour slots for Approved/Draft posts across all configured platforms.
 */
export function autoScheduleQueue(
  posts: SocialPost[],
  rules: AutoScheduleRule[],
  referenceDateIso: string,
  targetStatuses: PostStatus[] = ['Approved', 'Draft']
): AutoScheduleOutcome {
  const refDate = new Date(referenceDateIso);
  const occupiedSlots = new Set<string>();

  for (const post of posts) {
    if (post.status === 'Scheduled' || post.status === 'Published') {
      const d = new Date(post.scheduledAt);
      if (!Number.isNaN(d.getTime())) {
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
        occupiedSlots.add(key);
      }
    }
  }

  const ruleMap = new Map<PlatformId, AutoScheduleRule>();
  for (const r of rules) {
    ruleMap.set(r.platform, r);
  }

  const slotAssignments: Array<{ postId: string; title: string; scheduledAt: string }> = [];

  const updatedPosts = posts.map((post) => {
    if (!targetStatuses.includes(post.status)) {
      return post;
    }

    const primaryPlatform = post.platforms[0] ?? 'linkedin';
    const rule = ruleMap.get(primaryPlatform);
    if (rule && !rule.enabled) {
      return post;
    }

    const candidateHours =
      rule && rule.preferredHours.length > 0
        ? rule.preferredHours
        : PLATFORM_SPECS[primaryPlatform].peakHours;

    let assignedIso: string | null = null;

    for (let dayOffset = 1; dayOffset <= 21; dayOffset++) {
      for (const hour of candidateHours) {
        const candidate = new Date(
          Date.UTC(
            refDate.getUTCFullYear(),
            refDate.getUTCMonth(),
            refDate.getUTCDate() + dayOffset,
            hour,
            0,
            0,
            0
          )
        );
        const key = `${candidate.getUTCFullYear()}-${candidate.getUTCMonth()}-${candidate.getUTCDate()}-${candidate.getUTCHours()}`;
        if (!occupiedSlots.has(key)) {
          occupiedSlots.add(key);
          assignedIso = candidate.toISOString();
          break;
        }
      }
      if (assignedIso) break;
    }

    if (!assignedIso) {
      return post;
    }

    slotAssignments.push({
      postId: post.id,
      title: post.title,
      scheduledAt: assignedIso,
    });

    return {
      ...post,
      status: 'Scheduled' as PostStatus,
      scheduledAt: assignedIso,
      autoScheduled: true,
    };
  });

  return {
    updatedPosts,
    scheduledCount: slotAssignments.length,
    slotAssignments,
  };
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  avgEngagementRate: number;
  totalClicks: number;
  totalSaves: number;
  publishedCount: number;
  scheduledCount: number;
  pendingApprovalCount: number;
  topPost: SocialPost | null;
}

export function calculateAnalyticsSummary(
  posts: SocialPost[],
  analyticsSeries: AnalyticsPoint[],
  platformFilter: PlatformId | 'all',
  rangeDays: number
): AnalyticsSummary {
  const filteredPosts = posts.filter((p) =>
    platformFilter === 'all' ? true : p.platforms.includes(platformFilter)
  );

  const published = filteredPosts.filter((p) => p.status === 'Published' && p.metrics);
  const scheduledCount = filteredPosts.filter((p) => p.status === 'Scheduled').length;
  const pendingApprovalCount = filteredPosts.filter(
    (p) => p.status === 'In Review' || p.status === 'Changes Requested'
  ).length;

  let totalImpressions = 0;
  let totalReach = 0;
  let totalEngagements = 0;
  let totalClicks = 0;
  let totalSaves = 0;
  let topPost: SocialPost | null = null;

  for (const post of published) {
    const m = post.metrics!;
    totalImpressions += m.impressions;
    totalReach += m.reach;
    totalEngagements += m.likes + m.comments + m.shares + m.saves;
    totalClicks += m.clicks;
    totalSaves += m.saves;
    if (!topPost || m.engagementRate > (topPost.metrics?.engagementRate ?? 0)) {
      topPost = post;
    }
  }

  // Incorporate time-series window scaling when rangeDays < 30 for trend consistency
  const slicedSeries = analyticsSeries.slice(-rangeDays);
  if (platformFilter === 'all' && slicedSeries.length > 0 && published.length === 0) {
    totalReach = slicedSeries.reduce((acc, pt) => acc + pt.reach, 0);
    totalImpressions = slicedSeries.reduce((acc, pt) => acc + pt.impressions, 0);
    totalEngagements = slicedSeries.reduce((acc, pt) => acc + pt.engagements, 0);
  }

  const avgEngagementRate =
    published.length > 0
      ? Number(
          (
            published.reduce((sum, p) => sum + (p.metrics?.engagementRate ?? 0), 0) /
            published.length
          ).toFixed(2)
        )
      : totalReach > 0
        ? Number(((totalEngagements / totalReach) * 100).toFixed(2))
        : 0;

  return {
    totalImpressions,
    totalReach,
    totalEngagements,
    avgEngagementRate,
    totalClicks,
    totalSaves,
    publishedCount: published.length,
    scheduledCount,
    pendingApprovalCount,
    topPost,
  };
}

export function rankPostsByEngagement(
  posts: SocialPost[],
  sortBy: 'engagementRate' | 'reach' | 'impressions' | 'clicks' | 'saves' = 'engagementRate'
): SocialPost[] {
  return [...posts]
    .filter((p) => p.status === 'Published' && p.metrics)
    .sort((a, b) => {
      const ma = a.metrics!;
      const mb = b.metrics!;
      return mb[sortBy] - ma[sortBy];
    });
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
