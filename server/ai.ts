import { GoogleGenAI, Type } from '@google/genai';
import type {
  AiInsight,
  BrandAuditInput,
  BrandAuditReport,
  CompetitorAnalysisReport,
  ContentFormat,
  ContentIdeaBatch,
  ContentPillar,
  HashtagSuggestion,
  PerformanceForecastReport,
  PlatformId,
  Project,
  SocialPost,
} from '../src/types/workspace.ts';
import {
  computeAccountHistoricalBaseline,
  getRecommendedHashtagCount,
  normalizeHashtag,
  parseCompetitorProfileUrl,
} from '../src/utils/intelligence.ts';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateAiInsights(
  project: Project,
  projectPosts: SocialPost[]
): Promise<AiInsight[]> {
  const ai = getClient();

  const publishedSummary = projectPosts
    .filter((p) => p.status === 'Published' && p.metrics)
    .map((p) => ({
      title: p.title,
      platforms: p.platforms,
      format: p.format,
      impressions: p.metrics!.impressions,
      reach: p.metrics!.reach,
      saves: p.metrics!.saves,
      clicks: p.metrics!.clicks,
      engagementRate: p.metrics!.engagementRate,
      scheduledAt: p.scheduledAt,
    }));

  const prompt = `Analyze this brand's recent social media performance and return 3 concrete, data-backed optimization insights for future posts across LinkedIn, Instagram, Facebook, X, YouTube, Pinterest, and TikTok.

Brand: ${project.name} (${project.industry})
Summary: ${project.summary}
Total Followers: ${project.followersTotal} (+${project.followerGrowth30dPct}% 30d)
Published Post Metrics: ${JSON.stringify(publishedSummary)}

Return crisp, actionable recommendations referencing real formats, hooks, posting windows, and specific platforms.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a senior social media strategist. Output only concrete, realistic recommendations grounded in the supplied metrics without hype or vague filler.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short diagnostic headline under 12 words.' },
            platform: {
              type: Type.STRING,
              description: 'One of: linkedin, instagram, facebook, x, youtube, pinterest, tiktok, all',
            },
            impact: { type: Type.STRING, description: 'Either High or Medium' },
            metricTarget: { type: Type.STRING, description: 'Primary metric improved, e.g. Save Rate & Shares' },
            recommendation: { type: Type.STRING, description: 'Concrete creative or structural execution rule.' },
            suggestedTopic: { type: Type.STRING, description: 'Ready-to-use next post headline/topic.' },
            bestWindow: { type: Type.STRING, description: 'Recommended day and time window.' },
            predictedLiftPct: { type: Type.INTEGER, description: 'Estimated engagement lift percentage (10-50).' },
          },
          required: [
            'title',
            'platform',
            'impact',
            'metricTarget',
            'recommendation',
            'suggestedTopic',
            'bestWindow',
            'predictedLiftPct',
          ],
        },
      },
    },
  });

  const rawText = (response.text ?? '[]').trim();
  const parsed = JSON.parse(rawText) as Array<Omit<AiInsight, 'id'>>;
  const validPlatforms = new Set<string>([
    'linkedin',
    'instagram',
    'facebook',
    'x',
    'youtube',
    'pinterest',
    'tiktok',
    'all',
  ]);

  return parsed.slice(0, 4).map((item, idx) => ({
    id: `ins-ai-${Date.now()}-${idx}`,
    title: item.title,
    platform: validPlatforms.has(item.platform) ? (item.platform as PlatformId | 'all') : 'all',
    impact: item.impact === 'High' ? 'High' : 'Medium',
    metricTarget: item.metricTarget,
    recommendation: item.recommendation,
    suggestedTopic: item.suggestedTopic,
    bestWindow: item.bestWindow,
    predictedLiftPct: Math.max(5, Math.min(60, Number(item.predictedLiftPct) || 20)),
  }));
}

export interface GeneratedPostCopy {
  title: string;
  caption: string;
  hashtags: string[];
  optimizationNote: string;
}

export async function generatePostCopy(
  project: Project,
  platforms: PlatformId[],
  topic: string,
  tone: string,
  pillarName?: string
): Promise<GeneratedPostCopy> {
  const ai = getClient();
  const hasX = platforms.includes('x');

  const prompt = `Write a ready-to-publish social media post for ${project.name} (${project.industry}).
Target Platforms: ${platforms.join(', ')}
Topic / Brief: ${topic}
Content Pillar: ${pillarName || 'General Brand Storytelling'}
Tone: ${tone || 'Editorial, clear, high-retention'}
${hasX ? 'CRITICAL CONSTRAINT: X is selected, so keep the main caption + hashtags under 270 characters total.' : 'Keep caption crisp, scannable, and conversion-focused (under 600 characters).'}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are an editorial social copywriter. Never use generic AI clichés, excessive exclamation marks, or emoji clutter.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Internal calendar post title (4-8 words).' },
          caption: { type: Type.STRING, description: 'Publish-ready post body copy.' },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 4 relevant hashtags including # prefix.',
          },
          optimizationNote: {
            type: Type.STRING,
            description: 'One concise tip on visual framing or posting window for these channels.',
          },
        },
        required: ['title', 'caption', 'hashtags', 'optimizationNote'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as GeneratedPostCopy;
  return {
    title: parsed.title || topic.slice(0, 48),
    caption: parsed.caption || topic,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    optimizationNote: parsed.optimizationNote || 'Pair with a clean high-contrast asset.',
  };
}

export async function generateStrategyPillar(
  project: Project,
  goal: string
): Promise<Omit<ContentPillar, 'id' | 'projectId'>> {
  const ai = getClient();

  const prompt = `Propose one new strategic content pillar for ${project.name} (${project.industry}) focused on this goal: ${goal}.
Existing pillars: ${project.pillars.map((p) => p.name).join(', ')}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          targetSharePct: { type: Type.INTEGER },
          tone: { type: Type.STRING },
          audience: { type: Type.STRING },
        },
        required: ['name', 'description', 'targetSharePct', 'tone', 'audience'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<
    ContentPillar,
    'id' | 'projectId'
  >;
  return {
    name: parsed.name || 'Campaign Spotlight',
    description: parsed.description || goal,
    targetSharePct: Math.max(10, Math.min(50, Number(parsed.targetSharePct) || 25)),
    tone: parsed.tone || 'Clear, authoritative',
    audience: parsed.audience || 'Core brand audience',
  };
}

export async function analyzeCompetitors(
  project: Project,
  rawUrls: string[]
): Promise<CompetitorAnalysisReport> {
  const ai = getClient();
  const parsedList = rawUrls
    .map((u) => parseCompetitorProfileUrl(u))
    .filter((p) => p.valid);

  if (parsedList.length === 0) {
    throw new Error('Provide at least one valid competitor social profile URL.');
  }

  const prompt = `Conduct a competitive social media analysis for ${project.name} (${project.industry}).
Competitor profile URLs to evaluate:
${parsedList.map((p) => `- ${p.normalizedUrl} (Platform: ${p.platform}, Handle: ${p.handle})`).join('\n')}

Analyze each competitor's recent posts, estimated engagement rates, recurring content themes, and weekly posting frequency. Then synthesize a summary report with key strengths, weaknesses, and concrete opportunities for ${project.name} to capitalize on.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      competitors: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING },
            name: { type: Type.STRING },
            handle: { type: Type.STRING },
            platform: { type: Type.STRING },
            avgEngagementRate: { type: Type.NUMBER },
            postsPerWeek: { type: Type.NUMBER },
            estimatedFollowers: { type: Type.STRING },
            contentThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            recentPostHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'url',
            'name',
            'handle',
            'platform',
            'avgEngagementRate',
            'postsPerWeek',
            'estimatedFollowers',
            'contentThemes',
            'recentPostHighlights',
          ],
        },
      },
      executiveSummary: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      opportunitiesToCapitalize: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: [
      'competitors',
      'executiveSummary',
      'strengths',
      'weaknesses',
      'opportunitiesToCapitalize',
    ],
  };

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior competitive social intelligence analyst. Use live URL/search signals when accessible and provide realistic, grounded strategic analysis.',
        tools: [{ urlContext: {} }, { googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  } catch {
    // Fallback without urlContext if a target social platform blocks direct crawling alongside JSON schema
    response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior competitive social intelligence analyst. Provide realistic, structured competitive benchmarks and strategic opportunities.',
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  }

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<
    CompetitorAnalysisReport,
    'id' | 'createdAt' | 'urls' | 'groundingSources'
  >;

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const groundingSources = Array.isArray(chunks)
    ? chunks
        .map((c) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
        .map((w) => ({ title: w.title || w.uri, uri: w.uri }))
        .slice(0, 5)
    : undefined;

  return {
    id: `comp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    urls: parsedList.map((p) => p.normalizedUrl),
    competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
    executiveSummary: parsed.executiveSummary || 'Competitive benchmark completed.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    opportunitiesToCapitalize: Array.isArray(parsed.opportunitiesToCapitalize)
      ? parsed.opportunitiesToCapitalize
      : [],
    groundingSources,
  };
}

export async function generateContentIdeas(
  project: Project,
  industry: string,
  audienceInterests: string,
  platforms: PlatformId[]
): Promise<ContentIdeaBatch> {
  const ai = getClient();

  const prompt = `Generate exactly 5 creative, high-engagement social media content ideas tailored to current trends and audience interests.
Brand Context: ${project.name}
Industry / Niche: ${industry}
Target Audience Interests: ${audienceInterests || 'Product discovery, practical tutorials, behind-the-scenes authenticity'}
Target Platforms: ${platforms.join(', ')}

For each of the 5 ideas, specify a clear title, a brief description, a suggested content format (e.g., Video, Carousel, Infographic, Reel / Short, Thread), the best-fit platform from the selected platforms, a trend angle, and an opening hook.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a creative social media director. Return exactly 5 distinct, trend-savvy ideas with varied formats (Video, Carousel, Infographic, Reel / Short, Thread). Avoid clichés.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            format: { type: Type.STRING },
            platform: { type: Type.STRING },
            trendAngle: { type: Type.STRING },
            audienceHook: { type: Type.STRING },
          },
          required: ['title', 'description', 'format', 'platform', 'trendAngle', 'audienceHook'],
        },
      },
    },
  });

  const rawIdeas = JSON.parse((response.text ?? '[]').trim()) as Array<{
    title: string;
    description: string;
    format: string;
    platform: string;
    trendAngle: string;
    audienceHook: string;
  }>;

  const allowedSet = new Set<string>(platforms);
  const ideas = rawIdeas.slice(0, 5).map((item, idx) => ({
    id: `idea-${Date.now()}-${idx}`,
    title: item.title,
    description: item.description,
    format: item.format || 'Carousel',
    platform: (allowedSet.has(item.platform) ? item.platform : platforms[0] ?? 'instagram') as PlatformId,
    trendAngle: item.trendAngle,
    audienceHook: item.audienceHook,
  }));

  return {
    id: `batch-${Date.now()}`,
    createdAt: new Date().toISOString(),
    industry,
    audienceInterests,
    platforms,
    ideas,
  };
}

export async function forecastPostPerformance(
  project: Project,
  projectPosts: SocialPost[],
  params: {
    platform: PlatformId;
    format: ContentFormat;
    contentDescription: string;
  }
): Promise<PerformanceForecastReport> {
  const ai = getClient();
  const baseline = computeAccountHistoricalBaseline(
    projectPosts,
    project.analyticsSeries,
    params.platform
  );

  const prompt = `Predict social media performance metrics for a planned post using the account's historical baseline.

Account: ${project.name} (${project.industry}, ${project.followersTotal} total followers)
Target Platform: ${params.platform}
Content Format: ${params.format}
Planned Content Description: ${params.contentDescription}

Historical Account Baseline on ${params.platform}:
${JSON.stringify(baseline)}

Return realistic predicted metrics (likes, comments, shares, reach, engagementRate) calibrated against the account baseline, a confidenceScore (0-100), a concise summary, and 3-4 key factors influencing the forecast (impact: Positive | Neutral | Risk).`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a quantitative social media forecasting model. Ground predictions realistically near the supplied historical baseline rather than inventing inflated numbers.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedReach: { type: Type.INTEGER },
          predictedLikes: { type: Type.INTEGER },
          predictedComments: { type: Type.INTEGER },
          predictedShares: { type: Type.INTEGER },
          predictedEngagementRate: { type: Type.NUMBER },
          confidenceScore: { type: Type.INTEGER },
          summary: { type: Type.STRING },
          factors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                impact: { type: Type.STRING, description: 'Positive, Neutral, or Risk' },
                detail: { type: Type.STRING },
              },
              required: ['label', 'impact', 'detail'],
            },
          },
        },
        required: [
          'predictedReach',
          'predictedLikes',
          'predictedComments',
          'predictedShares',
          'predictedEngagementRate',
          'confidenceScore',
          'summary',
          'factors',
        ],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<
    PerformanceForecastReport,
    'id' | 'createdAt' | 'platform' | 'format' | 'contentDescription'
  >;

  return {
    id: `fc-${Date.now()}`,
    createdAt: new Date().toISOString(),
    platform: params.platform,
    format: params.format,
    contentDescription: params.contentDescription,
    predictedReach: Math.max(100, Number(parsed.predictedReach) || baseline.avgReach),
    predictedLikes: Math.max(10, Number(parsed.predictedLikes) || baseline.avgLikes),
    predictedComments: Math.max(1, Number(parsed.predictedComments) || baseline.avgComments),
    predictedShares: Math.max(1, Number(parsed.predictedShares) || baseline.avgShares),
    predictedEngagementRate: Number((Number(parsed.predictedEngagementRate) || baseline.avgEngagementRate).toFixed(2)),
    confidenceScore: Math.max(35, Math.min(98, Number(parsed.confidenceScore) || 78)),
    summary: parsed.summary || 'Forecast calibrated against recent platform performance.',
    factors: Array.isArray(parsed.factors) ? parsed.factors : [],
  };
}

export async function runBrandAudit(input: BrandAuditInput): Promise<BrandAuditReport> {
  const ai = getClient();

  const prompt = `Perform a comprehensive social media brand audit using the submitted metrics and brand profile:
${JSON.stringify(input, null, 2)}

Evaluate consistency, engagement health, profile optimization, and content mix. Return an overall score (0-100), 4 sub-scores (0-100), a concise executive verdict, key strengths, priority gaps, and 4 actionable best practices ranked by impact.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a principal brand & social operations auditor. Provide objective, calibrated scoring and specific best practices.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.INTEGER },
          subScores: {
            type: Type.OBJECT,
            properties: {
              consistency: { type: Type.INTEGER },
              engagementHealth: { type: Type.INTEGER },
              profileOptimization: { type: Type.INTEGER },
              contentMix: { type: Type.INTEGER },
            },
            required: ['consistency', 'engagementHealth', 'profileOptimization', 'contentMix'],
          },
          verdict: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          bestPractices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                priority: { type: Type.STRING, description: 'High or Medium' },
                recommendation: { type: Type.STRING },
                expectedOutcome: { type: Type.STRING },
              },
              required: ['category', 'priority', 'recommendation', 'expectedOutcome'],
            },
          },
        },
        required: ['overallScore', 'subScores', 'verdict', 'strengths', 'gaps', 'bestPractices'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<
    BrandAuditReport,
    'id' | 'createdAt' | 'input'
  >;

  const clamp = (n: number, fallback = 75) =>
    Math.max(10, Math.min(100, Math.round(Number(n) || fallback)));

  return {
    id: `audit-${Date.now()}`,
    createdAt: new Date().toISOString(),
    input,
    overallScore: clamp(parsed.overallScore, 78),
    subScores: {
      consistency: clamp(parsed.subScores?.consistency, 80),
      engagementHealth: clamp(parsed.subScores?.engagementHealth, 76),
      profileOptimization: clamp(parsed.subScores?.profileOptimization, 78),
      contentMix: clamp(parsed.subScores?.contentMix, 75),
    },
    verdict: parsed.verdict || 'Strong operational baseline with clear opportunities in cadence and community response.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    bestPractices: Array.isArray(parsed.bestPractices) ? parsed.bestPractices : [],
  };
}

export async function generateHashtagSuggestions(
  project: Project,
  params: {
    platforms: PlatformId[];
    topic: string;
    caption: string;
    format?: ContentFormat;
  }
): Promise<{ suggestions: HashtagSuggestion[]; strategyNote: string }> {
  const ai = getClient();
  const platforms: PlatformId[] = params.platforms.length ? params.platforms : ['instagram'];
  const primaryPlatform = platforms[0];
  const rec = getRecommendedHashtagCount(primaryPlatform);

  const prompt = `Generate trending, niche-specific hashtags for a social media post by ${project.name} (${project.industry}).

Selected Target Platforms: ${platforms.join(', ')} (Primary focus: ${primaryPlatform} — optimal range: ${rec.min}–${rec.max} tags)
Content Format: ${params.format || 'Single Post'}
Post Title / Topic: ${params.topic || '(not specified)'}
Post Caption Draft: ${params.caption || '(not specified)'}

Return 8 distinct, high-relevance hashtags mixing Trending discovery tags, Niche industry tags, Community tags, and 1 Brand/Campaign tag. Avoid generic spam tags (#fyp, #viral, #love). Match platform norms (e.g., concise searchable tags for LinkedIn/X, trend-savvy discovery tags for TikTok/Instagram).`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a social media growth & taxonomy strategist. Generate authentic, currently relevant, niche-specific hashtags tailored to the caption topic and target platform.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tag: { type: Type.STRING, description: 'Hashtag with # prefix and no spaces.' },
                category: {
                  type: Type.STRING,
                  description: 'One of: Trending, Niche, Community, Brand',
                },
                reachTier: {
                  type: Type.STRING,
                  description: 'One of: High Volume, Mid-Niche, Micro-Niche',
                },
                rationale: {
                  type: Type.STRING,
                  description: 'Concise 1-sentence explanation of why this tag fits the topic & platform.',
                },
                targetPlatform: {
                  type: Type.STRING,
                  description: 'Best-fit platform ID from the selected platforms.',
                },
              },
              required: ['tag', 'category', 'reachTier', 'rationale', 'targetPlatform'],
            },
          },
          strategyNote: {
            type: Type.STRING,
            description: 'One-sentence hashtag volume & placement tip for the selected channels.',
          },
        },
        required: ['suggestions', 'strategyNote'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    suggestions?: Array<{
      tag: string;
      category: string;
      reachTier: string;
      rationale: string;
      targetPlatform: string;
    }>;
    strategyNote?: string;
  };

  const allowedPlatforms = new Set<string>(platforms);
  const validCategories = new Set(['Trending', 'Niche', 'Community', 'Brand']);
  const validTiers = new Set(['High Volume', 'Mid-Niche', 'Micro-Niche']);
  const seen = new Set<string>();

  const suggestions: HashtagSuggestion[] = [];
  for (const item of parsed.suggestions ?? []) {
    const normalized = normalizeHashtag(item.tag || '');
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    suggestions.push({
      tag: normalized,
      category: (validCategories.has(item.category)
        ? item.category
        : 'Niche') as HashtagSuggestion['category'],
      reachTier: (validTiers.has(item.reachTier)
        ? item.reachTier
        : 'Mid-Niche') as HashtagSuggestion['reachTier'],
      rationale: item.rationale || `Relevant to ${params.topic || project.industry} on ${primaryPlatform}.`,
      targetPlatform: (allowedPlatforms.has(item.targetPlatform)
        ? item.targetPlatform
        : primaryPlatform) as PlatformId,
    });
  }

  return {
    suggestions: suggestions.slice(0, 10),
    strategyNote: parsed.strategyNote || rec.note,
  };
}


