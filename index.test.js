import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import fs from 'fs/promises';
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
  generateYearInReviewReport,
} from './index.js';

vi.mock('axios');
vi.mock('fs/promises');

describe('Index.js - Extended Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getWeekNumber', () => {
    it('should return ISO week number for January 1, 2025', () => {
      const date = new Date(2025, 0, 1);
      expect(getWeekNumber(date)).toBe(1);
    });

    it('should return ISO week number for January 7, 2025', () => {
      const date = new Date(2025, 0, 7);
      expect(getWeekNumber(date)).toBe(2);
    });

    it('should return ISO week number for December 31, 2025', () => {
      const date = new Date(2025, 11, 31);
      expect(getWeekNumber(date)).toBe(1);
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


    it('should count daily activity (0=Sunday, 6=Saturday)', () => {
      const events = [
        { created_at: '2025-01-05T00:00:00Z' },
        { created_at: '2025-01-06T00:00:00Z' },
        { created_at: '2025-01-13T00:00:00Z' },
      ];
      const result = analyzeTimePatterns(events);
      expect(result.dailyActivity[0]).toBe(1);
      expect(result.dailyActivity[1]).toBe(2);
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

    it('should handle single day streak', () => {
      const events = [
        { created_at: '2025-01-01T00:00:00Z' },
      ];
      const result = analyzeStreaks(events);
      expect(result.maxStreak).toBe(1);
      expect(result.totalActiveDays).toBe(1);
    });
  });

  describe('analyzeGitHubEvents', () => {
    it('should analyze empty events', () => {
      const result = analyzeGitHubEvents([], []);
      expect(result.totalEvents).toBe(0);
    });

    it('should count events by type', () => {
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
  });

  describe('analyzeGitHubTimePatterns', () => {
    it('should handle empty events', () => {
      const result = analyzeGitHubTimePatterns([]);
      expect(result).toBeDefined();
      expect(result.hourlyActivity).toBeDefined();
      expect(result.dailyActivity).toBeDefined();
      expect(result.monthlyActivity).toBeDefined();
    });

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
        { created_at: '2025-01-06T00:00:00Z' },
        { created_at: '2025-01-06T12:00:00Z' },
      ];
      const result = analyzeGitHubTimePatterns(events);
      expect(result.dailyActivity[1]).toBe(2);
    });
  });

  describe('analyzeGitHubStreaks', () => {
    it('should handle empty events', () => {
      const result = analyzeGitHubStreaks([]);
      expect(result).toBeDefined();
      expect(result.maxStreak).toBe(0);
      expect(result.totalActiveDays).toBe(0);
    });

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

  describe('generateYearInReviewReport', () => {
    it('should generate a report for GitLab only', () => {
      const summary = {
        year: 2025,
        user: { name: 'Test User', username: 'testuser' },
        gitlab: {
          overall: {
            totalActivities: 100,
            totalProjects: 5,
            totalCreatedMRs: 10,
            totalAssignedMRs: 15,
            totalCreatedIssues: 20,
            totalAssignedIssues: 25,
          },
          events: {
            totalEvents: 100,
            eventTypeCounts: {
              'pushed to': 50,
              'opened': 20,
              'merged': 15,
              'closed': 15,
            },
            monthlyActivity: {
              January: 10,
              February: 15,
              March: 20,
            },
            topProjects: [
              { project: 'Project A', count: 30 },
              { project: 'Project B', count: 20 },
            ],
            mostActiveMonth: 'March',
            projectContributions: {},
          },
          timePatterns: {
            hourlyActivity: { 9: 50 },
            dailyActivity: { 1: 60 },
            monthlyActivity: { January: 10, February: 15 },
          },
          mergeRequests: {
            totalCreated: 10,
            totalAssigned: 15,
            mergedCount: 8,
            openedCount: 2,
            closedCount: 0,
            averageTimeToMerge: 172800000,
            projectsWithMRs: [1, 2],
          },
          issues: {
            totalCreated: 20,
            totalAssigned: 25,
            closedCount: 15,
            openedCount: 5,
            projectsWithIssues: [1, 2, 3],
          },
          codeReviews: {
            totalReviewed: 12,
          },
          streaks: {
            maxStreak: 7,
            maxStreakStart: '2025-01-10',
            maxStreakEnd: '2025-01-16',
            totalActiveDays: 45,
          },
          projects: {
            total: 5,
            names: ['Project A', 'Project B', 'Project C', 'Project D', 'Project E'],
          },
        },
        github: null,
        overall: {
          totalActivities: 100,
          totalProjects: 5,
        },
      };

      const report = generateYearInReviewReport(summary);
      expect(report).toContain('Combined Year-in-Review Report - 2025');
      expect(report).toContain('Test User');
      expect(report).toContain('GitLab Activity');
      expect(report).toContain('Total Activities: 100');
    });
  });
});
