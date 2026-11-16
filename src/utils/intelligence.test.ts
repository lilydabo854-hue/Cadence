import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildForecastExportCsv,
  buildForecastExportMarkdown,
  computeAccountHistoricalBaseline,
  getRecommendedHashtagCount,
  mergeHashtags,
  normalizeHashtag,
  parseCompetitorProfileUrl,
  validateBrandAuditInput,
} from './intelligence';
import type { BrandAuditInput, PerformanceForecastReport, SocialPost } from '../types/workspace';

test('parseCompetitorProfileUrl validates and identifies social platforms and handles', () => {
  const ig = parseCompetitorProfileUrl('https://www.instagram.com/summerfridays/');
  assert.equal(ig.valid, true);
  assert.equal(ig.platform, 'instagram');
  assert.equal(ig.handle, '@summerfridays');

  const li = parseCompetitorProfileUrl('linkedin.com/company/glossier');
  assert.equal(li.valid, true);
  assert.equal(li.platform, 'linkedin');
  assert.equal(li.handle, '@glossier');

  const tt = parseCompetitorProfileUrl('https://www.tiktok.com/@rhode');
  assert.equal(tt.valid, true);
  assert.equal(tt.platform, 'tiktok');
  assert.equal(tt.handle, '@rhode');

  const empty = parseCompetitorProfileUrl('   ');
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const noDomain = parseCompetitorProfileUrl('not-a-valid-url');
  assert.equal(noDomain.valid, false);
  assert.ok(noDomain.error);

  const withSpaces = parseCompetitorProfileUrl('not a valid url!!!');
  assert.equal(withSpaces.valid, false);
  assert.ok(withSpaces.error);
});

test('computeAccountHistoricalBaseline averages platform-specific published metrics', () => {
  const posts: SocialPost[] = [
    {
      id: 'p1',
      projectId: 'proj-1',
      title: 'IG Post',
      caption: 'Test',
      hashtags: [],
      platforms: ['instagram'],
      format: 'Carousel',
      pillarId: 'pil-1',
      status: 'Published',
      scheduledAt: '2026-11-01T10:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
      metrics: {
        impressions: 20000,
        reach: 16000,
        likes: 800,
        comments: 60,
        shares: 90,
        saves: 300,
        clicks: 200,
        engagementRate: 7.8,
      },
    },
    {
      id: 'p2',
      projectId: 'proj-1',
      title: 'IG Post 2',
      caption: 'Test 2',
      hashtags: [],
      platforms: ['instagram'],
      format: 'Reel / Short',
      pillarId: 'pil-1',
      status: 'Published',
      scheduledAt: '2026-11-03T10:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
      metrics: {
        impressions: 30000,
        reach: 24000,
        likes: 1200,
        comments: 100,
        shares: 150,
        saves: 500,
        clicks: 300,
        engagementRate: 8.2,
      },
    },
  ];

  const baseline = computeAccountHistoricalBaseline(posts, [], 'instagram');
  assert.equal(baseline.samplePosts, 2);
  assert.equal(baseline.avgReach, 20000);
  assert.equal(baseline.avgLikes, 1000);
  assert.equal(baseline.avgComments, 80);
  assert.equal(baseline.avgShares, 120);
  assert.equal(baseline.avgEngagementRate, 8);
});

test('buildForecastExportCsv and buildForecastExportMarkdown format complete exportable reports', () => {
  const report: PerformanceForecastReport = {
    id: 'fc-1',
    createdAt: '2026-11-15T09:00:00.000Z',
    platform: 'instagram',
    format: 'Carousel',
    contentDescription: '5-slide barrier repair routine breakdown',
    predictedReach: 42500,
    predictedLikes: 2450,
    predictedComments: 132,
    predictedShares: 310,
    predictedEngagementRate: 7.85,
    confidenceScore: 86,
    summary: 'Strong carousel save velocity expected.',
    factors: [
      { label: 'Educational Carousel Fit', impact: 'Positive', detail: '2.1x higher saves on Instagram.' },
    ],
  };

  const csv = buildForecastExportCsv(report, 'Solstice Skincare');
  assert.ok(csv.includes('"Predicted Reach","42500"'));
  assert.ok(csv.includes('"Confidence Score (%)","86"'));

  const md = buildForecastExportMarkdown(report, 'Solstice Skincare');
  assert.ok(md.includes('# Performance Forecast Report — Solstice Skincare'));
  assert.ok(md.includes('| Reach | 42,500 |'));
  assert.ok(md.includes('Educational Carousel Fit'));
});

test('validateBrandAuditInput catches invalid ratings and empty brand fields', () => {
  const invalid: BrandAuditInput = {
    brandName: '',
    industry: 'Skincare',
    platforms: [],
    followersTotal: -10,
    postsPerMonth: 12,
    avgEngagementRate: 4.5,
    avgResponseHours: 6,
    bioClarityScore: 12,
    visualConsistencyScore: 8,
    contentMixSummary: 'Mostly reels',
    voiceAndAudienceNotes: 'Gen Z beauty buyers',
  };
  const res = validateBrandAuditInput(invalid);
  assert.equal(res.valid, false);
  assert.ok(res.errors.length >= 4);

  const valid: BrandAuditInput = {
    ...invalid,
    brandName: 'Solstice Skincare',
    platforms: ['instagram', 'tiktok'],
    followersTotal: 148200,
    bioClarityScore: 8,
  };
  const ok = validateBrandAuditInput(valid);
  assert.equal(ok.valid, true);
  assert.equal(ok.errors.length, 0);
});

test('normalizeHashtag, mergeHashtags, and getRecommendedHashtagCount enforce clean deduplicated tags', () => {
  assert.equal(normalizeHashtag('  ##Skin Barrier!! '), '#SkinBarrier');
  assert.equal(normalizeHashtag(''), '');

  const merged = mergeHashtags('#BrandStory #skincare', [
    'Skincare',
    '#BarrierRepair',
    'clean beauty!',
    '##barrierrepair',
  ]);
  assert.equal(merged, '#BrandStory #skincare #BarrierRepair #cleanbeauty');

  const xRec = getRecommendedHashtagCount('x');
  assert.equal(xRec.max, 2);
  const igRec = getRecommendedHashtagCount('instagram');
  assert.equal(igRec.max, 10);
});
