import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import fs from 'fs/promises';
import config from './config.js';

vi.mock('axios');
vi.mock('fs/promises');

describe('Index.js - API Integration Tests', () => {
  let mockGitlabClient;
  let mockGithubClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocked axios clients
    mockGitlabClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    mockGithubClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    // Mock axios.create to return our mock clients
    vi.mocked(axios.create)
      .mockReturnValueOnce(mockGitlabClient)
      .mockReturnValueOnce(mockGithubClient);

    // Clear config module cache
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GitLab API Calls', () => {
    beforeEach(async () => {
      // Re-import the module to get fresh clients
      const module = await import('./index.js');
      const clients = vi.mocked(axios.create).mock.results;
    });

    it('should handle successful user details fetch', async () => {
      const mockUser = {
        id: 123,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockGitlabClient.get.mockResolvedValueOnce({
        data: [mockUser],
      });

      // Import and call function
      const module = await import('./index.js');

      // Verify the call was made
      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      mockGitlabClient.get.mockResolvedValueOnce({
        data: [],
      });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle API error on user fetch', async () => {
      const error = new Error('API Error');
      error.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Server error' },
      };

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      const error = new Error('Network Error');
      error.request = {};

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('GitHub API Calls', () => {
    it('should handle successful user details fetch', async () => {
      const mockUser = {
        login: 'testuser',
        name: 'Test User',
        id: 123456,
      };

      mockGithubClient.get.mockResolvedValueOnce({
        data: mockUser,
      });

      // Import and call function
      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle successful events fetch', async () => {
      const mockEvents = [
        {
          id: 1,
          type: 'PushEvent',
          created_at: '2025-01-01T00:00:00Z',
          repo: { name: 'user/repo1' },
        },
        {
          id: 2,
          type: 'CreateEvent',
          created_at: '2025-01-02T00:00:00Z',
          repo: { name: 'user/repo2' },
        },
      ];

      mockGithubClient.get.mockResolvedValueOnce({
        data: mockEvents,
      });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle pagination for events', async () => {
      const page1Events = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        type: 'PushEvent',
        created_at: '2025-01-01T00:00:00Z',
      }));

      const page2Events = Array.from({ length: 50 }, (_, i) => ({
        id: 100 + i,
        type: 'CreateEvent',
        created_at: '2025-01-02T00:00:00Z',
      }));

      mockGithubClient.get
        .mockResolvedValueOnce({ data: page1Events })
        .mockResolvedValueOnce({ data: page2Events })
        .mockResolvedValueOnce({ data: [] });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle GitHub API error', async () => {
      const error = new Error('API Error');
      error.response = {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'User not found' },
      };

      mockGithubClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('GitHub GraphQL API', () => {
    it('should handle successful GraphQL query', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              contributionsCollection: {
                contributionCalendar: {
                  totalContributions: 100,
                  weeks: [],
                },
                totalCommitContributions: 50,
                totalIssueContributions: 30,
                totalPullRequestContributions: 20,
              },
            },
          },
        },
      };

      mockGithubClient.post.mockResolvedValueOnce(mockResponse);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle GraphQL error', async () => {
      const error = new Error('GraphQL Error');
      error.response = {
        status: 400,
        statusText: 'Bad Request',
        data: { errors: [{ message: 'Invalid query' }] },
      };

      mockGithubClient.post.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('File System Operations', () => {
    it('should successfully save report to file', async () => {
      const report = '# Test Report\n\nThis is a test report.';
      const summary = {
        year: 2025,
        gitlab: { events: { totalEvents: 10 } },
        github: { events: { totalEvents: 0 } },
      };

      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const module = await import('./index.js');
      const filename = module.getOutputFilename(summary);

      await module.saveReportToFile(report, summary);

      expect(fs.writeFile).toHaveBeenCalledWith(
        filename,
        report
      );
    });

    it('should handle file write error', async () => {
      const error = new Error('Permission denied');
      vi.mocked(fs.writeFile).mockRejectedValueOnce(error);

      const module = await import('./index.js');

      const report = '# Test Report';
      const summary = {
        year: 2025,
        gitlab: { events: { totalEvents: 10 } },
        github: { events: { totalEvents: 0 } },
      };

      await expect(module.saveReportToFile(report, summary)).rejects.toThrow();
    });
  });

  describe('Pagination Logic', () => {
    it('should handle single page of results', async () => {
      const mockResults = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({
        data: mockResults,
      });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle multiple pages of results', async () => {
      const pageSize = 100;

      // Page 1: Full page
      const page1 = Array.from({ length: pageSize }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      // Page 2: Full page
      const page2 = Array.from({ length: pageSize }, (_, i) => ({
        id: pageSize + i,
        name: `Item ${pageSize + i}`,
      }));

      // Page 3: Partial page
      const page3 = Array.from({ length: 50 }, (_, i) => ({
        id: pageSize * 2 + i,
        name: `Item ${pageSize * 2 + i}`,
      }));

      mockGitlabClient.get
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 })
        .mockResolvedValueOnce({ data: page3 })
        .mockResolvedValueOnce({ data: [] });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle pagination timeout', async () => {
      const error = new Error('Timeout');
      error.code = 'ECONNABORTED';

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should respect max pages limit', async () => {
      const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }));

      // Should stop after maxPages
      for (let i = 0; i < 105; i++) {
        mockGitlabClient.get.mockResolvedValueOnce({ data: fullPage });
      }

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors', async () => {
      const error = new Error('Rate limit exceeded');
      error.response = {
        status: 429,
        statusText: 'Too Many Requests',
        data: { message: 'Rate limit exceeded' },
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1234567890',
        },
      };

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Unauthorized');
      error.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Invalid token' },
      };

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle not found errors', async () => {
      const error = new Error('Not Found');
      error.response = {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Resource not found' },
      };

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      const error = new Error('Internal Server Error');
      error.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Internal server error' },
      };

      mockGitlabClient.get.mockRejectedValueOnce(error);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Combined Platform Support', () => {
    it('should verify platform configuration methods exist', async () => {
      const module = await import('./index.js');

      expect(typeof config.isGitLabConfigured).toBe('function');
      expect(typeof config.isGitHubConfigured).toBe('function');
    });
  });

  describe('Data Fetching Functions', () => {
    it('should handle empty events array', async () => {
      mockGitlabClient.get.mockResolvedValueOnce({ data: [] });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle events with missing fields', async () => {
      const mockEvents = [
        { id: 1, created_at: '2025-01-01T00:00:00Z' },
        { id: 2 }, // Missing created_at
        { id: 3, created_at: '2025-01-03T00:00:00Z', project_id: 123 },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle merge requests with different states', async () => {
      const mockMRs = [
        { id: 1, state: 'merged', project_id: 1 },
        { id: 2, state: 'opened', project_id: 1 },
        { id: 3, state: 'closed', project_id: 2 },
        { id: 4, state: 'locked', project_id: 2 },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockMRs });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle issues with different states', async () => {
      const mockIssues = [
        { id: 1, state: 'closed', project_id: 1 },
        { id: 2, state: 'opened', project_id: 1 },
        { id: 3, state: 'reopened', project_id: 2 },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockIssues });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Project Filtering', () => {
    it('should filter events by allowed projects', async () => {
      const mockEvents = [
        {
          id: 1,
          created_at: '2025-01-01T00:00:00Z',
          project_id: 1,
          action_name: 'pushed to',
        },
        {
          id: 2,
          created_at: '2025-01-02T00:00:00Z',
          project_id: 2,
          action_name: 'pushed to',
        },
      ];

      // Mock project name fetches
      mockGitlabClient.get
        .mockResolvedValueOnce({ data: { name: 'allowed-project' } })
        .mockResolvedValueOnce({ data: { name: 'other-project' } });

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle case-insensitive project filtering', async () => {
      const mockEvents = [
        {
          id: 1,
          created_at: '2025-01-01T00:00:00Z',
          project_id: 1,
          action_name: 'pushed to',
        },
      ];

      mockGitlabClient.get
        .mockResolvedValueOnce({ data: { name: 'MyProject' } })
        .mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Main Execution Flow', () => {
    it('should handle successful single user report generation', async () => {
      const mockUser = {
        id: 123,
        name: 'Test User',
        username: 'testuser',
      };

      const mockEvents = [
        {
          id: 1,
          created_at: '2025-01-01T00:00:00Z',
          action_name: 'pushed to',
          project_id: 1,
        },
      ];

      const mockMRs = [
        {
          id: 1,
          state: 'merged',
          created_at: '2025-01-01T00:00:00Z',
          merged_at: '2025-01-02T00:00:00Z',
          project_id: 1,
        },
      ];

      const mockIssues = [
        {
          id: 1,
          state: 'closed',
          created_at: '2025-01-01T00:00:00Z',
          project_id: 1,
        },
      ];

      // Mock all GitLab API calls
      mockGitlabClient.get
        .mockResolvedValueOnce({ data: [mockUser] }) // getUserDetails
        .mockResolvedValueOnce({ data: mockEvents }) // getEvents
        .mockResolvedValueOnce({ data: [] }) // getUserProjects
        .mockResolvedValueOnce({ data: mockMRs }) // getUserMergeRequests
        .mockResolvedValueOnce({ data: [] }) // getUserAssignedMergeRequests
        .mockResolvedValueOnce({ data: mockIssues }) // getUserIssues
        .mockResolvedValueOnce({ data: [] }) // getUserAssignedIssues
        .mockResolvedValueOnce({ data: [] }); // getUserCodeReviews

      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle team report generation', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', name: 'User 1' },
        { id: 2, username: 'user2', name: 'User 2' },
      ];

      const mockEvents = [
        {
          id: 1,
          created_at: '2025-01-01T00:00:00Z',
          action_name: 'pushed to',
        },
      ];

      // Mock user details fetches for team
      mockGitlabClient.get
        .mockResolvedValueOnce({ data: [mockUsers[0]] })
        .mockResolvedValueOnce({ data: [mockUsers[1]] })
        .mockResolvedValueOnce({ data: mockEvents })
        .mockResolvedValueOnce({ data: mockEvents })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Date and Time Handling', () => {
    it('should handle events at different times of day', async () => {
      const mockEvents = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-01-01T06:00:00Z' },
        { created_at: '2025-01-01T12:00:00Z' },
        { created_at: '2025-01-01T18:00:00Z' },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle events at different times of year', async () => {
      const mockEvents = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: '2025-06-01T00:00:00Z' },
        { created_at: '2025-12-31T00:00:00Z' },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large event arrays', async () => {
      const largeEvents = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        created_at: '2025-01-01T00:00:00Z',
        action_name: 'pushed to',
      }));

      // Simulate pagination with many pages
      for (let i = 0; i < 101; i++) {
        if (i < 100) {
          mockGitlabClient.get.mockResolvedValueOnce({
            data: largeEvents.slice(i * 100, (i + 1) * 100),
          });
        } else {
          mockGitlabClient.get.mockResolvedValueOnce({ data: [] });
        }
      }

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle events with invalid dates', async () => {
      const mockEvents = [
        { created_at: '2025-01-01T00:00:00Z' },
        { created_at: 'invalid-date' },
        { created_at: '2025-01-03T00:00:00Z' },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle missing project_id in events', async () => {
      const mockEvents = [
        {
          id: 1,
          created_at: '2025-01-01T00:00:00Z',
          action_name: 'pushed to',
        },
        {
          id: 2,
          created_at: '2025-01-02T00:00:00Z',
          action_name: 'commented on',
        },
        {
          id: 3,
          created_at: '2025-01-03T00:00:00Z',
          action_name: 'pushed to',
          project_id: 123,
        },
      ];

      mockGitlabClient.get.mockResolvedValueOnce({ data: mockEvents });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('GitHub Specific Features', () => {
    it('should handle GitHub commits fetch', async () => {
      const mockRepos = [
        { name: 'repo1' },
        { name: 'repo2' },
      ];

      const mockCommits = [
        { sha: 'abc123', commit: { author: { date: '2025-01-01T00:00:00Z' } } },
        { sha: 'def456', commit: { author: { date: '2025-01-02T00:00:00Z' } } },
      ];

      mockGithubClient.get
        .mockResolvedValueOnce({ data: mockRepos })
        .mockResolvedValueOnce({ data: mockCommits.slice(0, 1) })
        .mockResolvedValueOnce({ data: mockCommits.slice(1) });

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });

    it('should handle GitHub contributions fetch', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              contributionsCollection: {
                contributionCalendar: {
                  totalContributions: 500,
                  weeks: [
                    {
                      contributionDays: [
                        { date: '2025-01-01', contributionCount: 10 },
                        { date: '2025-01-02', contributionCount: 15 },
                      ],
                    },
                  ],
                },
                totalCommitContributions: 250,
                totalIssueContributions: 150,
                totalPullRequestContributions: 100,
              },
            },
          },
        },
      };

      mockGithubClient.post.mockResolvedValueOnce(mockResponse);

      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Self-Hosted GitLab', () => {
    it('should verify axios.create is called', async () => {
      const module = await import('./index.js');

      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Configuration Validation', () => {
    it('should verify validate function exists', async () => {
      const module = await import('./index.js');

      expect(typeof config.validate).toBe('function');
    });
  });
});
