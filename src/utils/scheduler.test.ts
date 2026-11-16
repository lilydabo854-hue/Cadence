import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_PLATFORMS,
  autoScheduleQueue,
  calculateAnalyticsSummary,
  rankPostsByEngagement,
  validatePostForPlatforms,
} from './scheduler';
import type { AutoScheduleRule, SocialPost } from '../types/workspace';

test('supports all 7 required social platforms', () => {
  assert.deepEqual(ALL_PLATFORMS, [
    'linkedin',
    'instagram',
    'facebook',
    'x',
    'youtube',
    'pinterest',
    'tiktok',
  ]);
});

test('validatePostForPlatforms enforces X 280-char limit and visual warnings', () => {
  const longCaption = 'a'.repeat(290);
  const resX = validatePostForPlatforms(longCaption, [], ['x'], false);
  assert.equal(resX.valid, false);
  assert.ok(resX.errors.some((e) => e.includes('X character limit exceeded')));

  const resInstaNoMedia = validatePostForPlatforms('Fresh drop out today.', ['#launch'], ['instagram', 'tiktok'], false);
  assert.equal(resInstaNoMedia.valid, true);
  assert.equal(resInstaNoMedia.warnings.length, 2);

  const resValid = validatePostForPlatforms('Fresh drop out today.', ['#launch'], ['linkedin', 'instagram'], true);
  assert.equal(resValid.valid, true);
  assert.equal(resValid.errors.length, 0);
  assert.equal(resValid.warnings.length, 0);
});

test('autoScheduleQueue assigns conflict-free peak-hour slots across platforms', () => {
  const basePosts: SocialPost[] = [
    {
      id: 'p-existing',
      projectId: 'proj-1',
      title: 'Already Scheduled',
      caption: 'Existing',
      hashtags: [],
      platforms: ['linkedin'],
      format: 'Single Post',
      pillarId: 'pil-1',
      status: 'Scheduled',
      scheduledAt: '2026-11-16T09:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
    },
    {
      id: 'p-approved-1',
      projectId: 'proj-1',
      title: 'LinkedIn Thought Piece',
      caption: 'Ready to schedule',
      hashtags: [],
      platforms: ['linkedin'],
      format: 'Article',
      pillarId: 'pil-1',
      status: 'Approved',
      scheduledAt: '2026-11-16T09:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
    },
    {
      id: 'p-draft-2',
      projectId: 'proj-1',
      title: 'TikTok Tutorial',
      caption: 'Short form clip',
      hashtags: [],
      platforms: ['tiktok'],
      format: 'Reel / Short',
      pillarId: 'pil-1',
      status: 'Draft',
      scheduledAt: '2026-11-16T09:00:00.000Z',
      autoScheduled: false,
      assignee: 'Marcus',
      comments: [],
    },
  ];

  const rules: AutoScheduleRule[] = [
    { platform: 'linkedin', enabled: true, preferredHours: [9, 12], weeklyTarget: 3 },
    { platform: 'tiktok', enabled: true, preferredHours: [18, 21], weeklyTarget: 4 },
  ];

  const outcome = autoScheduleQueue(basePosts, rules, '2026-11-15T10:00:00.000Z', ['Approved', 'Draft']);
  assert.equal(outcome.scheduledCount, 2);

  const scheduledLinkedIn = outcome.updatedPosts.find((p) => p.id === 'p-approved-1')!;
  assert.equal(scheduledLinkedIn.status, 'Scheduled');
  assert.equal(scheduledLinkedIn.autoScheduled, true);
  // 09:00 on Nov 16 is already occupied by p-existing, so it should pick 12:00 UTC on Nov 16
  assert.equal(scheduledLinkedIn.scheduledAt, '2026-11-16T12:00:00.000Z');

  const scheduledTikTok = outcome.updatedPosts.find((p) => p.id === 'p-draft-2')!;
  assert.equal(scheduledTikTok.scheduledAt, '2026-11-16T18:00:00.000Z');
});

test('calculateAnalyticsSummary and rankPostsByEngagement compute accurate totals', () => {
  const posts: SocialPost[] = [
    {
      id: '1',
      projectId: 'proj-1',
      title: 'Post A',
      caption: 'A',
      hashtags: [],
      platforms: ['instagram'],
      format: 'Carousel',
      pillarId: 'pil-1',
      status: 'Published',
      scheduledAt: '2026-11-10T12:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
      metrics: {
        impressions: 10000,
        reach: 8000,
        likes: 400,
        comments: 40,
        shares: 30,
        saves: 120,
        clicks: 210,
        engagementRate: 7.38,
      },
    },
    {
      id: '2',
      projectId: 'proj-1',
      title: 'Post B',
      caption: 'B',
      hashtags: [],
      platforms: ['linkedin'],
      format: 'Single Post',
      pillarId: 'pil-1',
      status: 'Published',
      scheduledAt: '2026-11-11T12:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
      metrics: {
        impressions: 5000,
        reach: 4200,
        likes: 120,
        comments: 18,
        shares: 12,
        saves: 25,
        clicks: 140,
        engagementRate: 4.17,
      },
    },
    {
      id: '3',
      projectId: 'proj-1',
      title: 'Post C',
      caption: 'C',
      hashtags: [],
      platforms: ['instagram'],
      format: 'Reel / Short',
      pillarId: 'pil-1',
      status: 'In Review',
      scheduledAt: '2026-11-18T12:00:00.000Z',
      autoScheduled: false,
      assignee: 'Elena',
      comments: [],
    },
  ];

  const allSummary = calculateAnalyticsSummary(posts, [], 'all', 30);
  assert.equal(allSummary.totalImpressions, 15000);
  assert.equal(allSummary.totalReach, 12200);
  assert.equal(allSummary.publishedCount, 2);
  assert.equal(allSummary.pendingApprovalCount, 1);
  assert.equal(allSummary.topPost?.id, '1');

  const ranked = rankPostsByEngagement(posts, 'engagementRate');
  assert.equal(ranked[0].id, '1');
  assert.equal(ranked[1].id, '2');
});
