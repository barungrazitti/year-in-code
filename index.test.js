import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  analyzeMergeRequests,
  analyzeIssues,
  analyzeTimePatterns,
  getWeekNumber,
  analyzeStreaks,
  analyzeGitHubEvents,
  analyzeGitHubTimePatterns,
  analyzeGitHubStreaks,
  getOutputFilename,
} from './index.js';

describe('Index.js - Utility Functions', () => {
  describe('getWeekNumber', () => {
    it('should return ISO week number for January 1, 2025', () => {
      const date = new Date(2025, 0, 1);
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(0);
      expect(weekNum).toBeLessThanOrEqual(53);
    });

    it('should return ISO week number for January 7, 2025', () => {
      const date = new Date(2025, 0, 7);
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(0);
      expect(weekNum).toBeLessThanOrEqual(53);
    });

    it('should return ISO week number for December 31, 2025', () => {
      const date = new Date(2025, 11, 31);
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(0);
      expect(weekNum).toBeLessThanOrEqual(53);
    });
  });

  describe('analyzeMergeRequests', () => {
    it('should analyze empty MR array', () => {
      const result = analyzeMergeRequests([]);
      expect(result.totalCreated).toBe(0);
      expect(result.mergedCount).toBe(0);
      expect(result.openedCount).toBe(0);
      expect(result.closedCount).toBe(0);
    });

    it('should count merged MRs', () => {
      const mrs = [
        {
          id: 1,
          state: 'merged',
          created_at: '2025-01-01T00:00:00Z',
          merged_at: '2025-01-02T00:00:00Z',
          project_id: 1,
        },
      ];
      const result = analyzeMergeRequests(mrs);
      expect(result.totalCreated).toBe(1);
      expect(result.mergedCount).toBe(1);
    });

    it('should count opened MRs', () => {
      const mrs = [
        {
          id: 1,
          state: 'opened',
          created_at: '2025-01-01T00:00:00Z',
          project_id: 1,
        },
      ];
      const result = analyzeMergeRequests(mrs);
      expect(result.openedCount).toBe(1);
    });

    it('should count closed MRs', () => {
      const mrs = [
        {
          id: 1,
          state: 'closed',
          created_at: '2025-01-01T00:00:00Z',
          project_id: 1,
        },
      ];
      const result = analyzeMergeRequests(mrs);
      expect(result.closedCount).toBe(1);
    });

    it('should calculate average time to merge', () => {
      const mrs = [
        {
          id: 1,
          state: 'merged',
          created_at: '2025-01-01T00:00:00Z',
          merged_at: '2025-01-03T00:00:00Z',
          project_id: 1,
        },
        {
          id: 2,
          state: 'merged',
          created_at: '2025-01-01T00:00:00Z',
          merged_at: '2025-01-05T00:00:00Z',
          project_id: 1,
        },
      ];
      const result = analyzeMergeRequests(mrs);
      expect(result.mergedCount).toBe(2);
      expect(result.averageTimeToMerge).toBeGreaterThan(0);
    });

    it('should track unique project IDs', () => {
      const mrs = [
        { id: 1, state: 'merged', project_id: 1 },
        { id: 2, state: 'opened', project_id: 2 },
        { id: 3, state: 'merged', project_id: 1 },
      ];
      const result = analyzeMergeRequests(mrs);
      expect(result.projectsWithMRs).toEqual([1, 2]);
    });
  });

  describe('analyzeIssues', () => {
    it('should analyze empty issues array', () => {
      const result = analyzeIssues([]);
      expect(result.totalCreated).toBe(0);
      expect(result.closedCount).toBe(0);
      expect(result.openedCount).toBe(0);
    });

    it('should count closed issues', () => {
      const issues = [
        { id: 1, state: 'closed', project_id: 1 },
      ];
      const result = analyzeIssues(issues);
      expect(result.closedCount).toBe(1);
    });

    it('should count opened issues', () => {
      const issues = [
        { id: 1, state: 'opened', project_id: 1 },
      ];
      const result = analyzeIssues(issues);
      expect(result.openedCount).toBe(1);
    });

    it('should track unique project IDs', () => {
      const issues = [
        { id: 1, state: 'closed', project_id: 1 },
        { id: 2, state: 'opened', project_id: 2 },
        { id: 3, state: 'closed', project_id: 1 },
      ];
      const result = analyzeIssues(issues);
      expect(result.projectsWithIssues).toEqual([1, 2]);
    });
  });

  describe('analyzeTimePatterns', () => {
    it('should analyze empty events array', () => {
      const result = analyzeTimePatterns([]);
      expect(result.hourlyActivity).toEqual({});
      expect(result.dailyActivity).toEqual({});
      expect(result.weeklyActivity).toEqual({});
      expect(result.monthlyActivity).toEqual({});
    });

    it('should count monthly activity', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-15T00:00:00Z' },
        { created_at: '2025-02-01T00:00:00Z' },
      ];
      const result = analyzeTimePatterns(events);
      expect(result.monthlyActivity['January']).toBe(2);
      expect(result.monthlyActivity['February']).toBe(1);
    });
  });

  describe('analyzeStreaks', () => {
    it('should handle empty events array', () => {
      const result = analyzeStreaks([]);
      expect(result.maxStreak).toBe(0);
      expect(result.totalActiveDays).toBe(0);
    });

    it('should calculate streak for consecutive days', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-02T00:00:00Z' },
        { created_at: '2025-01-03T00:00:00Z' },
      ];
      const result = analyzeStreaks(events);
      expect(result.maxStreak).toBe(3);
      expect(result.totalActiveDays).toBe(3);
    });

    it('should calculate streak for non-consecutive days', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-03T00:00:00Z' },
        { created_at: '2025-01-05T00:00:00Z' },
      ];
      const result = analyzeStreaks(events);
      expect(result.maxStreak).toBe(1);
      expect(result.totalActiveDays).toBe(3);
    });

    it('should find longest streak', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-02T00:00:00Z' },
        { created_at: '2025-01-05T00:00:00Z' },
        { created_at: '2025-01-06T00:00:00Z' },
        { created_at: '2025-01-07T00:00:00Z' },
      ];
      const result = analyzeStreaks(events);
      expect(result.maxStreak).toBe(3);
    });

    it('should track streak start and end dates', () => {
      const events = [
        { created_at: '2025-01-05T00:00:00Z' },
        { created_at: '2025-01-06T00:00:00Z' },
        { created_at: '2025-01-07T00:00:00Z' },
      ];
      const result = analyzeStreaks(events);
      expect(result.maxStreakStart).toBe('2025-01-05');
      expect(result.maxStreakEnd).toBe('2025-01-07');
    });
  });

  describe('analyzeGitHubEvents', () => {
    it('should analyze events', () => {
      const events = [
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'CreateEvent', created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeGitHubEvents(events, []);
      expect(result.totalEvents).toBe(3);
      expect(result.eventTypeCounts['PushEvent']).toBe(2);
      expect(result.eventTypeCounts['CreateEvent']).toBe(1);
    });

    it('should count repo activity', () => {
      const events = [
        { type: 'PushEvent', repo: { name: 'user/repo1' }, created_at: '2025-01-01T00:00:00Z' },
        { type: 'PushEvent', repo: { name: 'user/repo1' }, created_at: '2025-01-01T00:00:00Z' },
        { type: 'CreateEvent', repo: { name: 'user/repo2' }, created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeGitHubEvents(events, []);
      expect(result.repoActivity['user/repo1']).toBe(2);
      expect(result.repoActivity['user/repo2']).toBe(1);
    });

    it('should identify most active month', () => {
      const events = [
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'PushEvent', created_at: '2025-01-15T00:00:00Z' },
        { type: 'CreateEvent', created_at: '2025-02-01T00:00:00Z' },
      ];
      const result = analyzeGitHubEvents(events, []);
      expect(result.mostActiveMonth).toBe('January');
    });
  });

  describe('analyzeGitHubTimePatterns', () => {
    it('should analyze events', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeGitHubTimePatterns(events);
      expect(result.hourlyActivity).toBeDefined();
      expect(result.dailyActivity).toBeDefined();
      expect(result.monthlyActivity).toBeDefined();
    });

    it('should analyze daily activity', () => {
      const events = [
        { created_at: '2025-01-06T00:00:00Z' }, // Monday
        { created_at: '2025-01-06T12:00:00Z' }, // Monday
      ];
      const result = analyzeGitHubTimePatterns(events);
      expect(result.dailyActivity[1]).toBe(2);
    });
  });

  describe('analyzeGitHubStreaks', () => {
    it('should calculate streak for consecutive days', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-02T00:00:00Z' },
      ];
      const result = analyzeGitHubStreaks(events);
      expect(result.maxStreak).toBe(2);
      expect(result.totalActiveDays).toBe(2);
    });
  });

  describe('getOutputFilename', () => {
    let originalOutputFilename;

    beforeEach(() => {
      originalOutputFilename = process.env.OUTPUT_FILENAME;
    });

    afterEach(() => {
      if (originalOutputFilename) {
        process.env.OUTPUT_FILENAME = originalOutputFilename;
      } else {
        delete process.env.OUTPUT_FILENAME;
      }
    });

    it('should generate GitLab filename', () => {
      const summary = {
        gitlab: { events: { totalEvents: 10 } },
        github: { events: { totalEvents: 0 } },
      };
      const filename = getOutputFilename(summary);
      expect(filename).toContain('gitlab-year-in-review');
    });

    it('should generate GitHub filename', () => {
      const summary = {
        gitlab: { events: { totalEvents: 0 } },
        github: { events: { totalEvents: 10 } },
      };
      const filename = getOutputFilename(summary);
      expect(filename).toContain('github-year-in-review');
    });

    it('should generate combined filename for both platforms', () => {
      const summary = {
        gitlab: { events: { totalEvents: 10 } },
        github: { events: { totalEvents: 5 } },
      };
      const filename = getOutputFilename(summary);
      expect(filename).toContain('all-platforms-year-in-review');
    });

    it('should use custom filename if set in environment', () => {
      process.env.OUTPUT_FILENAME = 'custom-report.md';
      const summary = {
        gitlab: { events: { totalEvents: 10 } },
        github: { events: { totalEvents: 0 } },
      };
      const filename = getOutputFilename(summary);
      expect(filename).toBe('custom-report.md');
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle MR with missing merged_at', () => {
      const mrs = [
        {
          id: 1,
          state: 'merged',
          created_at: '2025-01-01T00:00:00Z',
          project_id: 1,
        },
      ];
      const result = analyzeMergeRequests(mrs);
      expect(result.totalCreated).toBe(1);
      expect(result.averageTimeToMerge).toBe(0);
    });

    it('should handle events with different timezones', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00+00:00' },
        { created_at: '2025-01-01T12:00:00-05:00' },
      ];
      const result = analyzeTimePatterns(events);
      expect(result.hourlyActivity).toBeDefined();
    });

    it('should handle single day streak', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeStreaks(events);
      expect(result.maxStreak).toBe(1);
      expect(result.totalActiveDays).toBe(1);
    });

    it('should handle GitHub events without repo', () => {
      const events = [
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeGitHubEvents(events, []);
      expect(result.totalEvents).toBe(1);
      expect(result.eventTypeCounts['PushEvent']).toBe(1);
    });

    it('should handle different GitHub event types', () => {
      const events = [
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'PullRequestEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'IssuesEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'WatchEvent', created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeGitHubEvents(events, []);
      expect(result.totalEvents).toBe(4);
      expect(result.eventTypeCounts['PushEvent']).toBe(1);
      expect(result.eventTypeCounts['PullRequestEvent']).toBe(1);
      expect(result.eventTypeCounts['IssuesEvent']).toBe(1);
      expect(result.eventTypeCounts['WatchEvent']).toBe(1);
    });

    it('should generate year string from date', () => {
      const date = new Date(2025, 5, 15);
      const month = date.toLocaleString('default', { month: 'long' });
      expect(month).toBe('June');
    });

    it('should handle invalid week number input', () => {
      const date = new Date('invalid');
      const weekNum = getWeekNumber(date);
      expect(typeof weekNum).toBe('number');
    });

    it('should handle empty GitLab events', () => {
      const events = [];
      const summary = {
        gitlab: {
          events: { totalEvents: 0, monthlyActivity: {} },
          mergeRequests: { totalCreated: 0, mergedCount: 0, openedCount: 0 },
          issues: { totalCreated: 0, closedCount: 0 },
          streaks: { maxStreak: 0, totalActiveDays: 0 },
          projects: { total: 0 },
        },
        github: { events: { totalEvents: 0 } },
      };
      const filename = getOutputFilename(summary);
      expect(filename).toContain('gitlab-year-in-review');
    });


    it('should handle events at different days of week', () => {
      const events = [
        { created_at: '2025-01-05T00:00:00Z' }, // Sunday
        { created_at: '2025-01-06T00:00:00Z' }, // Monday
        { created_at: '2025-01-07T00:00:00Z' }, // Tuesday
        { created_at: '2025-01-08T00:00:00Z' }, // Wednesday
        { created_at: '2025-01-09T00:00:00Z' }, // Thursday
        { created_at: '2025-01-10T00:00:00Z' }, // Friday
        { created_at: '2025-01-11T00:00:00Z' }, // Saturday
      ];
      const result = analyzeTimePatterns(events);
      expect(result.dailyActivity[0]).toBe(1); // Sunday
      expect(result.dailyActivity[1]).toBe(1); // Monday
      expect(result.dailyActivity[2]).toBe(1); // Tuesday
      expect(result.dailyActivity[3]).toBe(1); // Wednesday
      expect(result.dailyActivity[4]).toBe(1); // Thursday
      expect(result.dailyActivity[5]).toBe(1); // Friday
      expect(result.dailyActivity[6]).toBe(1); // Saturday
    });

    it('should count commits correctly', () => {
      const events = [
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
        { type: 'PushEvent', created_at: '2025-01-01T00:00:00Z' },
      ];
      const commits = [
        { sha: 'abc123' },
        { sha: 'def456' },
      ];
      const result = analyzeGitHubEvents(events, commits);
      expect(result.totalCommits).toBe(2);
    });

    it('should track contributions by repo', () => {
      const events = [
        { type: 'PushEvent', repo: { name: 'user/repo1' }, created_at: '2025-01-01T00:00:00Z' },
        { type: 'PushEvent', repo: { name: 'user/repo2' }, created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeGitHubEvents(events, []);
      expect(result.contributions).toBeDefined();
      expect(result.contributions['user/repo1']).toBeDefined();
      expect(result.contributions['user/repo2']).toBeDefined();
    });
  });
});
