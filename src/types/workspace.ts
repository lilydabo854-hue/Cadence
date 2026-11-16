export type PlatformId =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'youtube'
  | 'pinterest'
  | 'tiktok';

export type PostStatus =
  | 'Draft'
  | 'In Review'
  | 'Changes Requested'
  | 'Approved'
  | 'Scheduled'
  | 'Published';

export type ContentFormat =
  | 'Single Post'
  | 'Carousel'
  | 'Reel / Short'
  | 'Thread'
  | 'Video'
  | 'Pin'
  | 'Article';

export interface PostMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number; // percentage e.g. 5.42
}

export interface ApprovalComment {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  action?: 'comment' | 'approved' | 'changes_requested' | 'submitted';
}

export interface SocialPost {
  id: string;
  projectId: string;
  title: string;
  caption: string;
  hashtags: string[];
  platforms: PlatformId[];
  format: ContentFormat;
  pillarId: string;
  status: PostStatus;
  scheduledAt: string; // ISO string
  publishedAt?: string;
  assetId?: string;
  mediaKey?: string;
  autoScheduled: boolean;
  assignee: string;
  comments: ApprovalComment[];
  metrics?: PostMetrics;
}

export interface ContentPillar {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetSharePct: number;
  tone: string;
  audience: string;
}

export interface ContentAsset {
  id: string;
  projectId: string;
  title: string;
  type: 'image' | 'video' | 'template' | 'copy';
  source: 'upload' | 'canva' | 'studio';
  mediaKey?: string;
  dimensions: string;
  platforms: PlatformId[];
  tags: string[];
  createdAt: string;
  canvaDesignId?: string;
}

export interface CanvaDesign {
  id: string;
  title: string;
  category: string;
  dimensions: string;
  mediaKey: string;
  updatedAt: string;
  suggestedPlatforms: PlatformId[];
}

export interface AnalyticsPoint {
  date: string; // YYYY-MM-DD
  followers: number;
  reach: number;
  impressions: number;
  engagements: number;
  platformBreakdown: Record<PlatformId, number>;
}

export interface AutoScheduleRule {
  platform: PlatformId;
  enabled: boolean;
  preferredHours: number[]; // UTC/local hours e.g. [9, 14, 18]
  weeklyTarget: number;
}

export interface AiInsight {
  id: string;
  title: string;
  platform: PlatformId | 'all';
  impact: 'High' | 'Medium';
  metricTarget: string;
  recommendation: string;
  suggestedTopic: string;
  bestWindow: string;
  predictedLiftPct: number;
}

export type ThemeMode = 'light' | 'dark';
export type ThemePresetId = 'aurora' | 'sunset' | 'berry' | 'lagoon' | 'matcha' | 'prism';
export type BackgroundPatternId = 'terrazzo' | 'dots' | 'waves' | 'grid' | 'checks' | 'none';
export type SurfaceTranslucency = 'sheer' | 'frosted' | 'crisp';
export type UiDensity = 'comfortable' | 'compact';
export type CornerRadius = 'sharp' | 'balanced' | 'soft';
export type FontPair = 'jakarta' | 'outfit' | 'fraunces';

export interface BrandingConfig {
  workspaceName: string;
  workspaceTagline: string;
  accentColor: string;
  themeMode: ThemeMode;
  themePreset?: ThemePresetId;
  backgroundPattern?: BackgroundPatternId;
  surfaceTranslucency?: SurfaceTranslucency;
  density: UiDensity;
  cornerRadius: CornerRadius;
  fontPair: FontPair;
  showWatermarkInPreviews: boolean;
}

export interface CompetitorProfileSummary {
  url: string;
  name: string;
  handle: string;
  platform: PlatformId | 'web';
  avgEngagementRate: number;
  postsPerWeek: number;
  estimatedFollowers: string;
  contentThemes: string[];
  recentPostHighlights: string[];
}

export interface CompetitorAnalysisReport {
  id: string;
  createdAt: string;
  urls: string[];
  competitors: CompetitorProfileSummary[];
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  opportunitiesToCapitalize: string[];
  groundingSources?: Array<{ title: string; uri: string }>;
}

export interface ContentIdeaItem {
  id: string;
  title: string;
  description: string;
  format: string;
  platform: PlatformId;
  trendAngle: string;
  audienceHook: string;
}

export interface ContentIdeaBatch {
  id: string;
  createdAt: string;
  industry: string;
  audienceInterests: string;
  platforms: PlatformId[];
  ideas: ContentIdeaItem[];
}

export interface ForecastFactor {
  label: string;
  impact: 'Positive' | 'Neutral' | 'Risk';
  detail: string;
}

export interface PerformanceForecastReport {
  id: string;
  createdAt: string;
  platform: PlatformId;
  format: ContentFormat;
  contentDescription: string;
  predictedReach: number;
  predictedLikes: number;
  predictedComments: number;
  predictedShares: number;
  predictedEngagementRate: number;
  confidenceScore: number;
  summary: string;
  factors: ForecastFactor[];
}

export interface BrandAuditInput {
  brandName: string;
  industry: string;
  platforms: PlatformId[];
  followersTotal: number;
  postsPerMonth: number;
  avgEngagementRate: number;
  avgResponseHours: number;
  bioClarityScore: number;
  visualConsistencyScore: number;
  contentMixSummary: string;
  voiceAndAudienceNotes: string;
}

export interface BrandAuditPractice {
  category: string;
  priority: 'High' | 'Medium';
  recommendation: string;
  expectedOutcome: string;
}

export interface BrandAuditReport {
  id: string;
  createdAt: string;
  input: BrandAuditInput;
  overallScore: number;
  subScores: {
    consistency: number;
    engagementHealth: number;
    profileOptimization: number;
    contentMix: number;
  };
  verdict: string;
  strengths: string[];
  gaps: string[];
  bestPractices: BrandAuditPractice[];
}

export interface Project {
  id: string;
  name: string;
  industry: string;
  handle: string;
  summary: string;
  connectedPlatforms: PlatformId[];
  followersTotal: number;
  followerGrowth30dPct: number;
  autoScheduleEnabled: boolean;
  autoScheduleRules: AutoScheduleRule[];
  pillars: ContentPillar[];
  analyticsSeries: AnalyticsPoint[];
  insights: AiInsight[];
  competitorReports?: CompetitorAnalysisReport[];
  ideaBatches?: ContentIdeaBatch[];
  forecasts?: PerformanceForecastReport[];
  brandAudits?: BrandAuditReport[];
}

export interface CanvaConnectionState {
  connected: boolean;
  accountEmail?: string;
  oauthConfigured: boolean;
  lastSyncedAt?: string;
  designs: CanvaDesign[];
}

export interface HashtagSuggestion {
  tag: string;
  category: 'Trending' | 'Niche' | 'Community' | 'Brand';
  reachTier: 'High Volume' | 'Mid-Niche' | 'Micro-Niche';
  rationale: string;
  targetPlatform: PlatformId;
}

export interface WorkspaceState {
  activeProjectId: string;
  branding: BrandingConfig;
  canva: CanvaConnectionState;
  projects: Project[];
  posts: SocialPost[];
  assets: ContentAsset[];
}
