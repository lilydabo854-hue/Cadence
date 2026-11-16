import fs from 'node:fs';
import path from 'node:path';
import type {
  AnalyticsPoint,
  AutoScheduleRule,
  BrandingConfig,
  CanvaDesign,
  ContentAsset,
  PlatformId,
  Project,
  SocialPost,
  WorkspaceState,
} from '../src/types/workspace.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'workspace.json');

function buildAnalyticsSeries(
  baseFollowers: number,
  growthPerDay: number,
  baseReach: number,
  seedOffset: number
): AnalyticsPoint[] {
  const points: AnalyticsPoint[] = [];
  const start = new Date('2026-08-18T00:00:00.000Z');
  let followers = baseFollowers;

  for (let i = 0; i < 90; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const wave = Math.sin((i + seedOffset) * 0.38) * 0.22 + Math.cos((i + seedOffset) * 0.17) * 0.12;
    const weekendLift = d.getUTCDay() === 0 || d.getUTCDay() === 6 ? 1.14 : 1.0;
    const reach = Math.round(baseReach * (1 + wave + i * 0.004) * weekendLift);
    const impressions = Math.round(reach * 1.42);
    const engagements = Math.round(reach * (0.048 + (i % 5) * 0.004));
    followers += Math.round(growthPerDay * (1 + wave * 0.5));

    points.push({
      date: d.toISOString().slice(0, 10),
      followers,
      reach,
      impressions,
      engagements,
      platformBreakdown: {
        linkedin: Math.round(reach * 0.17),
        instagram: Math.round(reach * 0.24),
        facebook: Math.round(reach * 0.11),
        x: Math.round(reach * 0.12),
        youtube: Math.round(reach * 0.13),
        pinterest: Math.round(reach * 0.08),
        tiktok: Math.round(reach * 0.15),
      },
    });
  }
  return points;
}

function defaultAutoRules(): AutoScheduleRule[] {
  return [
    { platform: 'linkedin', enabled: true, preferredHours: [9, 12, 16], weeklyTarget: 4 },
    { platform: 'instagram', enabled: true, preferredHours: [11, 14, 19], weeklyTarget: 5 },
    { platform: 'facebook', enabled: true, preferredHours: [10, 13, 18], weeklyTarget: 3 },
    { platform: 'x', enabled: true, preferredHours: [8, 12, 17], weeklyTarget: 7 },
    { platform: 'youtube', enabled: true, preferredHours: [14, 17], weeklyTarget: 2 },
    { platform: 'pinterest', enabled: true, preferredHours: [15, 20], weeklyTarget: 4 },
    { platform: 'tiktok', enabled: true, preferredHours: [12, 18, 21], weeklyTarget: 5 },
  ];
}

function createSeedState(): WorkspaceState {
  const defaultBranding: BrandingConfig = {
    workspaceName: 'Cadence Studio',
    workspaceTagline: 'Editorial Social Operations',
    accentColor: '#0F766E',
    themeMode: 'light',
    themePreset: 'aurora',
    backgroundPattern: 'terrazzo',
    surfaceTranslucency: 'frosted',
    density: 'comfortable',
    cornerRadius: 'balanced',
    fontPair: 'jakarta',
    showWatermarkInPreviews: false,
  };

  const canvaDesigns: CanvaDesign[] = [
    {
      id: 'canva-des-1',
      title: 'Winter Botanical Serum Launch — 4:5 Carousel Cover',
      category: 'Product Launch',
      dimensions: '1080 × 1350 px',
      mediaKey: 'canva_template_launch',
      updatedAt: '2026-11-14T16:20:00.000Z',
      suggestedPlatforms: ['instagram', 'pinterest', 'linkedin'],
    },
    {
      id: 'canva-des-2',
      title: 'Clinical Efficacy Ingredient Breakdown — LinkedIn Slide',
      category: 'Thought Leadership',
      dimensions: '1200 × 1500 px',
      mediaKey: 'asset_skincare_serum',
      updatedAt: '2026-11-12T11:05:00.000Z',
      suggestedPlatforms: ['linkedin', 'facebook', 'x'],
    },
    {
      id: 'canva-des-3',
      title: 'Acoustic Isolation Spec Sheet — Dark Slate Hero',
      category: 'Hardware Launch',
      dimensions: '1600 × 1200 px',
      mediaKey: 'asset_audio_headphones',
      updatedAt: '2026-11-11T09:40:00.000Z',
      suggestedPlatforms: ['youtube', 'linkedin', 'x'],
    },
    {
      id: 'canva-des-4',
      title: 'Morning Pour-Over Extraction Guide — 9:16 Reel Cover',
      category: 'Short-Form Video',
      dimensions: '1080 × 1920 px',
      mediaKey: 'asset_coffee_pour',
      updatedAt: '2026-11-10T14:15:00.000Z',
      suggestedPlatforms: ['tiktok', 'instagram', 'youtube'],
    },
  ];

  const projects: Project[] = [
    {
      id: 'proj-solstice',
      name: 'Solstice Skincare',
      industry: 'Clean Beauty & Dermatology',
      handle: '@solsticeskin',
      summary: 'Q4 barrier-repair serum launch across visual discovery, short-form tutorials, and B2B founder storytelling.',
      connectedPlatforms: ['linkedin', 'instagram', 'facebook', 'x', 'youtube', 'pinterest', 'tiktok'],
      followersTotal: 148200,
      followerGrowth30dPct: 14.6,
      autoScheduleEnabled: true,
      autoScheduleRules: defaultAutoRules(),
      pillars: [
        {
          id: 'pil-sol-1',
          projectId: 'proj-solstice',
          name: 'Clinical Efficacy & Formulation',
          description: 'Ingredient science, lab testing transparency, and dermatologist Q&As.',
          targetSharePct: 35,
          tone: 'Evidence-led, calm authority',
          audience: 'Ingredient-conscious buyers & beauty editors',
        },
        {
          id: 'pil-sol-2',
          projectId: 'proj-solstice',
          name: 'Daily Rituals & Texture',
          description: 'ASMR application clips, morning/evening routines, and sensory storytelling.',
          targetSharePct: 40,
          tone: 'Warm, tactile, unhurried',
          audience: 'Skincare enthusiasts on Instagram, TikTok, Pinterest',
        },
        {
          id: 'pil-sol-3',
          projectId: 'proj-solstice',
          name: 'Founder & Sustainability Notes',
          description: 'Refillable packaging milestones, retail partnerships, and supply-chain updates.',
          targetSharePct: 25,
          tone: 'Candid, editorial, transparent',
          audience: 'LinkedIn retail buyers, press, and brand loyalists',
        },
      ],
      analyticsSeries: buildAnalyticsSeries(128400, 660, 42500, 1),
      insights: [
        {
          id: 'ins-sol-1',
          title: 'Carousel ingredient breakdowns outperform single stills by 2.4x saves',
          platform: 'instagram',
          impact: 'High',
          metricTarget: 'Save Rate & Shares',
          recommendation: 'Lead frame 1 with the active percentage callout and reserve product beauty shots for slide 2.',
          suggestedTopic: '3 Reasons Bakuchiol Pairs Better With Ceramides Than Retinol Alone',
          bestWindow: 'Tue & Thu · 11:00–13:00',
          predictedLiftPct: 34,
        },
        {
          id: 'ins-sol-2',
          title: 'Founder formulation threads drive highest B2B profile clicks',
          platform: 'linkedin',
          impact: 'High',
          metricTarget: 'Link CTR',
          recommendation: 'Pair raw R&D packaging prototype photos with 3-bullet unit economics or refill impact metrics.',
          suggestedTopic: 'Why We Switched Our 30ml Dropper to Amber Recycled Glass Despite +18% Freight Cost',
          bestWindow: 'Wed · 09:00',
          predictedLiftPct: 28,
        },
        {
          id: 'ins-sol-3',
          title: 'Vertical texture loops convert best at 9–14s duration on TikTok',
          platform: 'tiktok',
          impact: 'Medium',
          metricTarget: '3-Second Hold Rate',
          recommendation: 'Open directly on the serum drop hitting warm stone with ambient sound before text overlay.',
          suggestedTopic: '10-Second Barrier Recovery Check After Cold Weather Flights',
          bestWindow: 'Daily · 18:00–21:00',
          predictedLiftPct: 22,
        },
      ],
      competitorReports: [
        {
          id: 'comp-sol-seed',
          createdAt: '2026-11-14T15:00:00.000Z',
          urls: [
            'https://www.instagram.com/summerfridays',
            'https://www.tiktok.com/@rhode',
          ],
          competitors: [
            {
              url: 'https://www.instagram.com/summerfridays',
              name: 'Summer Fridays',
              handle: '@summerfridays',
              platform: 'instagram',
              avgEngagementRate: 4.8,
              postsPerWeek: 6,
              estimatedFollowers: '1.1M',
              contentThemes: ['Texture swatches', 'Holiday bundle unboxing', 'Creator routines'],
              recentPostHighlights: [
                'Lip butter balm shade comparison carousel led with 4.2K saves',
                'Minimalist vanity shelfie reel posted at 11:00 AM',
              ],
            },
            {
              url: 'https://www.tiktok.com/@rhode',
              name: 'Rhode Skin',
              handle: '@rhode',
              platform: 'tiktok',
              avgEngagementRate: 6.4,
              postsPerWeek: 8,
              estimatedFollowers: '1.9M',
              contentThemes: ['10-second ASMR application', 'Behind-the-scenes shoot', 'Community duets'],
              recentPostHighlights: [
                'Pocket blush 12-second morning commute clip hit high replay rate',
                'Founder packing tutorial generated strong comment velocity',
              ],
            },
          ],
          executiveSummary:
            'Top clean-beauty peers dominate high-frequency sensory clips on TikTok and lifestyle carousels on Instagram, yet rarely publish transparent clinical hydration benchmarks or refillable packaging unit data.',
          strengths: [
            'Consistent 6–8x/week cadence keeps algorithmic recency high across Reels and TikTok.',
            'Strong sensory texture close-ups create unmistakable feed recognition without heavy text overlays.',
          ],
          weaknesses: [
            'Minimal dermatologist-backed efficacy education or before/after barrier metrics.',
            'LinkedIn B2B storytelling and Pinterest evergreen ritual guides are largely under-indexed.',
          ],
          opportunitiesToCapitalize: [
            'Own the "Clinical Ingredient Transparency" carousel lane on Instagram where saves outpace lifestyle stills.',
            'Pair sensory 10-second TikTok texture clips with pinned dermatologist comment Q&As to differentiate on trust.',
            'Scale LinkedIn founder & refillable packaging economics posts to capture retail buyer mindshare.',
          ],
        },
      ],
      ideaBatches: [
        {
          id: 'batch-sol-seed',
          createdAt: '2026-11-14T12:00:00.000Z',
          industry: 'Clean Beauty & Dermatology',
          audienceInterests: 'Skin barrier repair, ingredient layering, refillable packaging',
          platforms: ['instagram', 'tiktok', 'linkedin'],
          ideas: [
            {
              id: 'idea-sol-1',
              title: 'Barrier Math: 1% Bakuchiol vs Traditional Retinol',
              description:
                '5-slide minimalist infographic carousel comparing redness scores, barrier water loss, and AM/PM pairing rules.',
              format: 'Carousel',
              platform: 'instagram',
              trendAngle: 'Skin-cycling simplification & gentle actives',
              audienceHook: 'Save this before layering your winter actives.',
            },
            {
              id: 'idea-sol-2',
              title: '12-Second Cabin Air Moisture Seal Test',
              description:
                'Unfiltered macro video applying 3 drops of botanical serum over damp mist with ambient sound and crisp timer overlay.',
              format: 'Video',
              platform: 'tiktok',
              trendAngle: 'Winter travel skincare prep',
              audienceHook: 'How 3 drops hold hydration through a 6-hour flight.',
            },
            {
              id: 'idea-sol-3',
              title: 'The True Unit Cost of Refillable Amber Glass',
              description:
                'Transparent LinkedIn breakdown of freight weight trade-offs, PCR glass sourcing, and 74% repeat refill retention.',
              format: 'Infographic',
              platform: 'linkedin',
              trendAngle: 'Sustainable CPG unit economics',
              audienceHook: 'Why we absorbed an 18% freight increase to eliminate single-use pumps.',
            },
            {
              id: 'idea-sol-4',
              title: '30-Second Pharmacist Shelf Audit',
              description:
                'Fast-cut short-form video reviewing three common winter moisturizer mistakes and the exact humectant order to fix them.',
              format: 'Reel / Short',
              platform: 'instagram',
              trendAngle: 'De-influencing & minimalist 3-step routines',
              audienceHook: 'You only need three steps when temperatures drop below freezing.',
            },
            {
              id: 'idea-sol-5',
              title: 'Inside Our 28-Day Clinical Hydration Ledger',
              description:
                'Visual chart breakdown of transepidermal water loss results across 48 test panelists, linked to the full study summary.',
              format: 'Infographic',
              platform: 'linkedin',
              trendAngle: 'Evidence-first clean beauty',
              audienceHook: 'What 28 days of clinical barrier testing actually showed.',
            },
          ],
        },
      ],
      forecasts: [
        {
          id: 'fc-sol-seed',
          createdAt: '2026-11-14T16:30:00.000Z',
          platform: 'instagram',
          format: 'Carousel',
          contentDescription:
            '5-slide clinical breakdown showing how ceramides + 1% bakuchiol reduce winter moisture loss by 31%, paired with travertine serum photography.',
          predictedReach: 56400,
          predictedLikes: 3680,
          predictedComments: 196,
          predictedShares: 445,
          predictedEngagementRate: 9.42,
          confidenceScore: 88,
          summary:
            'Strong save and share momentum expected; educational carousels on Solstice Skincare currently outperform single-image posts by 2.4x saves.',
          factors: [
            {
              label: 'Carousel Educational Format',
              impact: 'Positive',
              detail: 'Account history averages 9.81% ER on clinical ingredient carousels.',
            },
            {
              label: 'Specific Clinical Metric Hook',
              impact: 'Positive',
              detail: 'Leading with the 31% TEWL stat drives higher slide-2 swipe-through.',
            },
            {
              label: 'Peak Window Alignment',
              impact: 'Neutral',
              detail: 'Publishing Tue/Thu 11:00–13:00 maximizes early save velocity.',
            },
          ],
        },
      ],
      brandAudits: [
        {
          id: 'audit-sol-seed',
          createdAt: '2026-11-14T10:00:00.000Z',
          input: {
            brandName: 'Solstice Skincare',
            industry: 'Clean Beauty & Dermatology',
            platforms: ['linkedin', 'instagram', 'facebook', 'x', 'youtube', 'pinterest', 'tiktok'],
            followersTotal: 148200,
            postsPerMonth: 24,
            avgEngagementRate: 8.12,
            avgResponseHours: 4,
            bioClarityScore: 9,
            visualConsistencyScore: 9,
            contentMixSummary: '40% Reels/Shorts, 35% Educational Carousels, 25% Founder & Retail Updates',
            voiceAndAudienceNotes: 'Evidence-led calm authority targeting ingredient-conscious buyers & retail editors.',
          },
          overallScore: 89,
          subScores: {
            consistency: 92,
            engagementHealth: 91,
            profileOptimization: 88,
            contentMix: 85,
          },
          verdict:
            'High-performing omnichannel presence with standout save rates and cohesive visual identity; expanding YouTube Shorts & Pinterest seasonal boards offers the highest incremental growth.',
          strengths: [
            '8.12% average engagement rate significantly exceeds clean-beauty industry median (3.5–4.5%).',
            'Fast 4-hour community reply cadence reinforces clinical credibility in comment threads.',
          ],
          gaps: [
            'YouTube long-form & Shorts cadence trails Instagram/TikTok volume.',
            'Weekend automated scheduling slots on Pinterest can capture higher seasonal gift-guide intent.',
          ],
          bestPractices: [
            {
              category: 'Short-Form Video',
              priority: 'High',
              recommendation: 'Cross-publish top-performing 15s TikTok texture clips natively to YouTube Shorts with keyword-rich titles.',
              expectedOutcome: '+25% non-follower discovery reach within 30 days.',
            },
            {
              category: 'Community Conversion',
              priority: 'Medium',
              recommendation: 'Pin a concise regimen FAQ comment on every clinical carousel with direct product batch links.',
              expectedOutcome: '+15% outbound link CTR from high-save posts.',
            },
          ],
        },
      ],
    },
    {
      id: 'proj-aether',
      name: 'Aether Audio',
      industry: 'Consumer Hardware & Acoustics',
      handle: '@aetheraudio',
      summary: 'Studio Reference One wireless flagship campaign targeting audiophiles, producers, and design press.',
      connectedPlatforms: ['linkedin', 'instagram', 'x', 'youtube', 'tiktok', 'facebook', 'pinterest'],
      followersTotal: 92400,
      followerGrowth30dPct: 11.2,
      autoScheduleEnabled: true,
      autoScheduleRules: defaultAutoRules(),
      pillars: [
        {
          id: 'pil-aet-1',
          projectId: 'proj-aether',
          name: 'Acoustic Engineering',
          description: 'Frequency response curves, driver architecture, and ANC lab benchmarks.',
          targetSharePct: 45,
          tone: 'Technical, crisp, authoritative',
          audience: 'Audio engineers, tech reviewers, YouTube & X hardware community',
        },
        {
          id: 'pil-aet-2',
          projectId: 'proj-aether',
          name: 'Creator Studio Visits',
          description: 'Behind-the-scenes mixing sessions with independent musicians.',
          targetSharePct: 35,
          tone: 'Documentary, intimate, focused',
          audience: 'Producers on Instagram, TikTok, and YouTube Shorts',
        },
        {
          id: 'pil-aet-3',
          projectId: 'proj-aether',
          name: 'Industrial Design Craft',
          description: 'Anodized aluminum machining and replaceable ear-pad longevity.',
          targetSharePct: 20,
          tone: 'Minimalist, architectural',
          audience: 'Design buyers on Pinterest and LinkedIn',
        },
      ],
      analyticsSeries: buildAnalyticsSeries(81200, 380, 31800, 7),
      insights: [
        {
          id: 'ins-aet-1',
          title: 'YouTube Shorts tear-downs drive 3.1x higher subscriber conversion',
          platform: 'youtube',
          impact: 'High',
          metricTarget: 'Subscriber Conversion',
          recommendation: 'Cut 45-second magnet array assembly clips from long-form factory tours and pin product links.',
          suggestedTopic: 'Inside the 40mm Beryllium Driver: 45s Acoustic Chamber Test',
          bestWindow: 'Thu & Sun · 17:00',
          predictedLiftPct: 41,
        },
        {
          id: 'ins-aet-2',
          title: 'X spec-comparison threads generate 2.8x reply depth',
          platform: 'x',
          impact: 'Medium',
          metricTarget: 'Replies & Bookmarks',
          recommendation: 'Post raw dB attenuation charts as image 1 instead of lifestyle renders on X.',
          suggestedTopic: 'Why Open-Back Clarity Usually Fails on Flights—And How We Tuned Our Acoustic Seal',
          bestWindow: 'Mon & Wed · 12:00',
          predictedLiftPct: 26,
        },
      ],
    },
    {
      id: 'proj-northline',
      name: 'Northline Coffee',
      industry: 'Specialty Roastery & Café',
      handle: '@northlineroast',
      summary: 'Direct-trade harvest releases, pour-over brew recipes, and wholesale café partner stories.',
      connectedPlatforms: ['instagram', 'tiktok', 'pinterest', 'youtube', 'facebook', 'linkedin', 'x'],
      followersTotal: 64900,
      followerGrowth30dPct: 19.4,
      autoScheduleEnabled: true,
      autoScheduleRules: defaultAutoRules(),
      pillars: [
        {
          id: 'pil-nor-1',
          projectId: 'proj-northline',
          name: 'Brew Guides & Extraction',
          description: 'Water temperature, grind calibration, and 60-second pour-over recipes.',
          targetSharePct: 50,
          tone: 'Approachable, sensory, precise',
          audience: 'Home baristas on TikTok, Instagram, Pinterest',
        },
        {
          id: 'pil-nor-2',
          projectId: 'proj-northline',
          name: 'Origin & Harvest Transparency',
          description: 'Farm-gate pricing reports and washed vs natural lot tastings.',
          targetSharePct: 30,
          tone: 'Grounded, documentary',
          audience: 'Wholesale buyers on LinkedIn & newsletter subscribers',
        },
        {
          id: 'pil-nor-3',
          projectId: 'proj-northline',
          name: 'Roastery Community',
          description: 'Weekend cupping sessions and seasonal menu drops.',
          targetSharePct: 20,
          tone: 'Warm, neighborhood-focused',
          audience: 'Local guests on Facebook & Instagram Stories',
        },
      ],
      analyticsSeries: buildAnalyticsSeries(53400, 390, 26400, 13),
      insights: [
        {
          id: 'ins-nor-1',
          title: 'Step-by-step pour-over pins generate steady evergreen referral clicks',
          platform: 'pinterest',
          impact: 'High',
          metricTarget: 'Outbound Recipe Clicks',
          recommendation: 'Overlay exact gram ratios (18g : 300g) cleanly on vertical 2:3 brew photography.',
          suggestedTopic: 'V60 Single-Cup Ratio Card: Washed Ethiopian Sidama',
          bestWindow: 'Sat & Sun · 20:00',
          predictedLiftPct: 37,
        },
      ],
    },
  ];

  const assets: ContentAsset[] = [
    {
      id: 'ast-sol-1',
      projectId: 'proj-solstice',
      title: 'Botanical Serum — Travertine Morning Hero',
      type: 'image',
      source: 'studio',
      mediaKey: 'asset_skincare_serum',
      dimensions: '1600 × 1200 px',
      platforms: ['instagram', 'linkedin', 'facebook', 'pinterest'],
      tags: ['serum', 'product-hero', 'q4-launch'],
      createdAt: '2026-11-04T09:15:00.000Z',
    },
    {
      id: 'ast-sol-2',
      projectId: 'proj-solstice',
      title: 'Aura Stone Series — Canva Editorial Grid',
      type: 'template',
      source: 'canva',
      mediaKey: 'canva_template_launch',
      dimensions: '1080 × 1350 px',
      platforms: ['instagram', 'pinterest', 'linkedin'],
      tags: ['canva', 'carousel', 'radiance-jar'],
      createdAt: '2026-11-09T14:30:00.000Z',
      canvaDesignId: 'canva-des-1',
    },
    {
      id: 'ast-aet-1',
      projectId: 'proj-aether',
      title: 'Studio Reference One — Slate Plinth Shot',
      type: 'image',
      source: 'studio',
      mediaKey: 'asset_audio_headphones',
      dimensions: '1600 × 1200 px',
      platforms: ['youtube', 'linkedin', 'x', 'instagram'],
      tags: ['hardware', 'anc', 'flagship'],
      createdAt: '2026-11-05T11:20:00.000Z',
    },
    {
      id: 'ast-nor-1',
      projectId: 'proj-northline',
      title: 'Morning Gooseneck Pour-Over Extraction',
      type: 'video',
      source: 'studio',
      mediaKey: 'asset_coffee_pour',
      dimensions: '1080 × 1920 px',
      platforms: ['tiktok', 'instagram', 'youtube', 'pinterest'],
      tags: ['pour-over', 'vertical', 'brew-guide'],
      createdAt: '2026-11-07T08:45:00.000Z',
    },
  ];

  const posts: SocialPost[] = [
    {
      id: 'post-sol-1',
      projectId: 'proj-solstice',
      title: 'Bakuchiol + Ceramide Barrier Carousel',
      caption:
        'Gentle cellular turnover without compromising your moisture barrier. Our clinical 28-day study measured a 31% reduction in transepidermal water loss using cold-pressed rosehip, argan, and 1% bakuchiol.',
      hashtags: ['#BarrierRepair', '#CleanFormulation', '#SolsticeSkincare'],
      platforms: ['instagram', 'pinterest'],
      format: 'Carousel',
      pillarId: 'pil-sol-1',
      status: 'Published',
      scheduledAt: '2026-11-06T11:00:00.000Z',
      publishedAt: '2026-11-06T11:00:00.000Z',
      assetId: 'ast-sol-1',
      mediaKey: 'asset_skincare_serum',
      autoScheduled: true,
      assignee: 'Elena Vance',
      comments: [
        {
          id: 'c-1',
          authorName: 'Maya Lin',
          authorRole: 'Brand Lead',
          body: 'Clinical stat is crystal clear on slide 1. Approved for Friday morning slot.',
          createdAt: '2026-11-05T16:10:00.000Z',
          action: 'approved',
        },
      ],
      metrics: {
        impressions: 68400,
        reach: 54100,
        likes: 3420,
        comments: 184,
        shares: 412,
        saves: 1290,
        clicks: 940,
        engagementRate: 9.81,
      },
    },
    {
      id: 'post-sol-2',
      projectId: 'proj-solstice',
      title: 'Refillable Glass Supply Chain Breakdown',
      caption:
        'Switching from virgin acrylic to 100% PCR amber glass added 18% to our unit freight weight—and cut repeat customer packaging waste by 74% across Q3. Full sustainability ledger below.',
      hashtags: ['#SustainableBeauty', '#PackagingDesign', '#CPG'],
      platforms: ['linkedin', 'facebook'],
      format: 'Article',
      pillarId: 'pil-sol-3',
      status: 'Published',
      scheduledAt: '2026-11-09T09:00:00.000Z',
      publishedAt: '2026-11-09T09:00:00.000Z',
      assetId: 'ast-sol-2',
      mediaKey: 'canva_template_launch',
      autoScheduled: false,
      assignee: 'Elena Vance',
      comments: [],
      metrics: {
        impressions: 41200,
        reach: 32900,
        likes: 1180,
        comments: 96,
        shares: 215,
        saves: 310,
        clicks: 1420,
        engagementRate: 5.47,
      },
    },
    {
      id: 'post-sol-3',
      projectId: 'proj-solstice',
      title: 'Winter Moisture Seal 15s Texture Clip',
      caption:
        'Three drops pressed into damp skin right after misting locks hydration through dry cabin air and winter radiators.',
      hashtags: ['#WinterSkincare', '#GlowRoutine', '#FacialOil'],
      platforms: ['tiktok', 'youtube'],
      format: 'Reel / Short',
      pillarId: 'pil-sol-2',
      status: 'Published',
      scheduledAt: '2026-11-11T18:00:00.000Z',
      publishedAt: '2026-11-11T18:00:00.000Z',
      assetId: 'ast-sol-1',
      mediaKey: 'asset_skincare_serum',
      autoScheduled: true,
      assignee: 'Marcus Reid',
      comments: [],
      metrics: {
        impressions: 94300,
        reach: 81600,
        likes: 5890,
        comments: 245,
        shares: 680,
        saves: 2140,
        clicks: 760,
        engagementRate: 10.97,
      },
    },
    {
      id: 'post-sol-4',
      projectId: 'proj-solstice',
      title: 'Dermatologist Myth-Busting Thread on Oils',
      caption:
        'Myth: Facial oils clog every acne-prone pore. Reality: High-linoleic rosehip oil actually balances sebum viscosity when layered over water-based humectants.',
      hashtags: ['#SkincareScience', '#DermFacts'],
      platforms: ['x'],
      format: 'Thread',
      pillarId: 'pil-sol-1',
      status: 'Published',
      scheduledAt: '2026-11-12T12:00:00.000Z',
      publishedAt: '2026-11-12T12:00:00.000Z',
      autoScheduled: true,
      assignee: 'Elena Vance',
      comments: [],
      metrics: {
        impressions: 29500,
        reach: 24100,
        likes: 820,
        comments: 74,
        shares: 195,
        saves: 410,
        clicks: 620,
        engagementRate: 6.22,
      },
    },
    {
      id: 'post-sol-5',
      projectId: 'proj-solstice',
      title: 'Stone Series Radiance Cream Reveal',
      caption:
        'Refillable stoneware jars engineered to live on your vanity, not in landfill. Reserve early access for the November batch.',
      hashtags: ['#StoneSeries', '#RefillableBeauty', '#Solstice'],
      platforms: ['instagram', 'linkedin', 'pinterest'],
      format: 'Carousel',
      pillarId: 'pil-sol-3',
      status: 'Scheduled',
      scheduledAt: '2026-11-17T14:00:00.000Z',
      assetId: 'ast-sol-2',
      mediaKey: 'canva_template_launch',
      autoScheduled: true,
      assignee: 'Elena Vance',
      comments: [
        {
          id: 'c-2',
          authorName: 'Maya Lin',
          authorRole: 'Brand Lead',
          body: 'Typography crop from Canva matches our Q4 grid perfectly.',
          createdAt: '2026-11-14T10:15:00.000Z',
          action: 'approved',
        },
      ],
    },
    {
      id: 'post-sol-6',
      projectId: 'proj-solstice',
      title: 'Evening Barrier Reset Routine (YouTube + TikTok)',
      caption:
        'Full 45-second evening layering walk-through showing exact drop counts and wait times between actives.',
      hashtags: ['#NightRoutine', '#SkinBarrier', '#SkincareTips'],
      platforms: ['tiktok', 'youtube', 'instagram'],
      format: 'Reel / Short',
      pillarId: 'pil-sol-2',
      status: 'In Review',
      scheduledAt: '2026-11-19T18:00:00.000Z',
      assetId: 'ast-sol-1',
      mediaKey: 'asset_skincare_serum',
      autoScheduled: false,
      assignee: 'Marcus Reid',
      comments: [
        {
          id: 'c-3',
          authorName: 'Marcus Reid',
          authorRole: 'Video Producer',
          body: 'Uploaded color-graded export and updated caption hook for YouTube Shorts SEO. Ready for sign-off.',
          createdAt: '2026-11-15T07:30:00.000Z',
          action: 'submitted',
        },
      ],
    },
    {
      id: 'post-sol-7',
      projectId: 'proj-solstice',
      title: 'Holiday Gift Guide Pinterest Pin Set',
      caption:
        'Curated botanical gift sets with zero outer plastic wrap. Save to your winter wellness board.',
      hashtags: ['#CleanGiftGuide', '#MinimalistSkincare'],
      platforms: ['pinterest', 'facebook'],
      format: 'Pin',
      pillarId: 'pil-sol-2',
      status: 'In Review',
      scheduledAt: '2026-11-20T15:00:00.000Z',
      assetId: 'ast-sol-2',
      mediaKey: 'canva_template_launch',
      autoScheduled: false,
      assignee: 'Elena Vance',
      comments: [
        {
          id: 'c-4',
          authorName: 'Elena Vance',
          authorRole: 'Social Strategist',
          body: 'Added UTM tracking parameters for Pinterest Shopping catalog.',
          createdAt: '2026-11-15T06:45:00.000Z',
          action: 'submitted',
        },
      ],
    },
    {
      id: 'post-sol-8',
      projectId: 'proj-solstice',
      title: 'Q4 Retail Partner Announcement Draft',
      caption:
        'Excited to share that Solstice Botanical Serum rolls out to 42 independent apothecaries next week.',
      hashtags: ['#RetailLaunch', '#CleanBeauty'],
      platforms: ['linkedin', 'x'],
      format: 'Single Post',
      pillarId: 'pil-sol-3',
      status: 'Approved',
      scheduledAt: '2026-11-22T09:00:00.000Z',
      assetId: 'ast-sol-1',
      mediaKey: 'asset_skincare_serum',
      autoScheduled: false,
      assignee: 'Elena Vance',
      comments: [],
    },
    // Project 2: Aether Audio
    {
      id: 'post-aet-1',
      projectId: 'proj-aether',
      title: 'Studio Reference One — 42dB Broadband ANC Benchmark',
      caption:
        'Measured in our anechoic chamber: zero upper-mid coloration with ANC engaged. Built for engineers who travel.',
      hashtags: ['#StudioReference', '#AudioEngineering', '#AetherAudio'],
      platforms: ['youtube', 'linkedin', 'x'],
      format: 'Video',
      pillarId: 'pil-aet-1',
      status: 'Published',
      scheduledAt: '2026-11-08T17:00:00.000Z',
      publishedAt: '2026-11-08T17:00:00.000Z',
      assetId: 'ast-aet-1',
      mediaKey: 'asset_audio_headphones',
      autoScheduled: true,
      assignee: 'Devon Brooks',
      comments: [],
      metrics: {
        impressions: 58200,
        reach: 46900,
        likes: 2640,
        comments: 192,
        shares: 340,
        saves: 880,
        clicks: 1580,
        engagementRate: 8.64,
      },
    },
    {
      id: 'post-aet-2',
      projectId: 'proj-aether',
      title: 'Machined Anodized Hinge — 10-Year Repairability Spec',
      caption:
        'Every hinge pin, battery pack, and lambskin pad is user-serviceable with a single Torx T6 driver.',
      hashtags: ['#RightToRepair', '#IndustrialDesign'],
      platforms: ['instagram', 'pinterest', 'linkedin'],
      format: 'Carousel',
      pillarId: 'pil-aet-3',
      status: 'In Review',
      scheduledAt: '2026-11-18T14:00:00.000Z',
      assetId: 'ast-aet-1',
      mediaKey: 'asset_audio_headphones',
      autoScheduled: false,
      assignee: 'Devon Brooks',
      comments: [
        {
          id: 'c-5',
          authorName: 'Devon Brooks',
          authorRole: 'Product Marketing',
          body: 'Need hardware lead confirmation on the Torx driver size before scheduling.',
          createdAt: '2026-11-14T18:00:00.000Z',
          action: 'submitted',
        },
      ],
    },
    {
      id: 'post-aet-3',
      projectId: 'proj-aether',
      title: 'Late-Night Mastering Session With Studio Reference One',
      caption:
        'How producer Kaelen Vance checks sub-bass translation without studio monitors on tour.',
      hashtags: ['#MusicProduction', '#Mastering'],
      platforms: ['tiktok', 'youtube', 'instagram'],
      format: 'Reel / Short',
      pillarId: 'pil-aet-2',
      status: 'Scheduled',
      scheduledAt: '2026-11-16T18:00:00.000Z',
      assetId: 'ast-aet-1',
      mediaKey: 'asset_audio_headphones',
      autoScheduled: true,
      assignee: 'Devon Brooks',
      comments: [],
    },
    // Project 3: Northline Coffee
    {
      id: 'post-nor-1',
      projectId: 'proj-northline',
      title: 'V60 1:16.5 Morning Extraction Recipe',
      caption:
        '94°C soft water, 45g bloom for 40 seconds, slow spiral pour to 300g. Highlighting bergamot and stone-fruit notes in our washed Sidama lot.',
      hashtags: ['#PourOver', '#SpecialtyCoffee', '#NorthlineRoast'],
      platforms: ['tiktok', 'instagram', 'pinterest', 'youtube'],
      format: 'Reel / Short',
      pillarId: 'pil-nor-1',
      status: 'Published',
      scheduledAt: '2026-11-10T12:00:00.000Z',
      publishedAt: '2026-11-10T12:00:00.000Z',
      assetId: 'ast-nor-1',
      mediaKey: 'asset_coffee_pour',
      autoScheduled: true,
      assignee: 'Sora Takahashi',
      comments: [],
      metrics: {
        impressions: 72100,
        reach: 61400,
        likes: 4120,
        comments: 158,
        shares: 520,
        saves: 2680,
        clicks: 890,
        engagementRate: 12.18,
      },
    },
    {
      id: 'post-nor-2',
      projectId: 'proj-northline',
      title: '2026 Harvest Farm-Gate Transparency Report',
      caption:
        'We paid an average of $4.85/lb FOB across 14 partner micro-lots this season—more than double commodity benchmarks.',
      hashtags: ['#DirectTrade', '#CoffeeTransparency'],
      platforms: ['linkedin', 'facebook', 'x'],
      format: 'Article',
      pillarId: 'pil-nor-2',
      status: 'In Review',
      scheduledAt: '2026-11-19T10:00:00.000Z',
      assetId: 'ast-nor-1',
      mediaKey: 'asset_coffee_pour',
      autoScheduled: false,
      assignee: 'Sora Takahashi',
      comments: [],
    },
  ];

  return {
    activeProjectId: 'proj-solstice',
    branding: defaultBranding,
    canva: {
      connected: false,
      oauthConfigured: Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET),
      designs: canvaDesigns,
    },
    projects,
    posts,
    assets,
  };
}

export class WorkspaceStore {
  private state: WorkspaceState;

  constructor() {
    this.state = this.load();
  }

  private load(): WorkspaceState {
    const seed = createSeedState();
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as WorkspaceState;
        if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          // Refresh dynamic oauthConfigured flag from environment
          parsed.canva.oauthConfigured = Boolean(
            process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET
          );
          // Backfill newly introduced theme & intelligence seed fields on existing workspaces
          const seedById = new Map(seed.projects.map((p) => [p.id, p]));
          let hydrated = false;
          if (!parsed.branding.themePreset || !parsed.branding.backgroundPattern || !parsed.branding.surfaceTranslucency) {
            parsed.branding = {
              ...seed.branding,
              ...parsed.branding,
              themePreset: parsed.branding.themePreset ?? seed.branding.themePreset,
              backgroundPattern: parsed.branding.backgroundPattern ?? seed.branding.backgroundPattern,
              surfaceTranslucency: parsed.branding.surfaceTranslucency ?? seed.branding.surfaceTranslucency,
              accentColor:
                !parsed.branding.themePreset && parsed.branding.accentColor === '#1D4ED8'
                  ? seed.branding.accentColor
                  : parsed.branding.accentColor,
            };
            hydrated = true;
          }
          parsed.projects = parsed.projects.map((proj) => {
            const seedProj = seedById.get(proj.id);
            if (!seedProj) return proj;
            const nextProj = { ...proj };
            if (!nextProj.competitorReports && seedProj.competitorReports) {
              nextProj.competitorReports = seedProj.competitorReports;
              hydrated = true;
            }
            if (!nextProj.ideaBatches && seedProj.ideaBatches) {
              nextProj.ideaBatches = seedProj.ideaBatches;
              hydrated = true;
            }
            if (!nextProj.forecasts && seedProj.forecasts) {
              nextProj.forecasts = seedProj.forecasts;
              hydrated = true;
            }
            if (!nextProj.brandAudits && seedProj.brandAudits) {
              nextProj.brandAudits = seedProj.brandAudits;
              hydrated = true;
            }
            return nextProj;
          });
          if (hydrated) {
            this.persist(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load workspace state, using seed data:', err);
    }
    this.persist(seed);
    return seed;
  }

  private persist(nextState: WorkspaceState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist workspace state:', err);
    }
  }

  getState(): WorkspaceState {
    return this.state;
  }

  updateState(updater: (prev: WorkspaceState) => WorkspaceState): WorkspaceState {
    this.state = updater(this.state);
    this.persist(this.state);
    return this.state;
  }
}

export const workspaceStore = new WorkspaceStore();
