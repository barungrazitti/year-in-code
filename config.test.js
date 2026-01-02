import { describe, it, expect } from 'vitest';
import config from './config.js';

describe('Config', () => {
  describe('GitLab Configuration', () => {
    it('should have a baseUrl property', () => {
      expect(config.gitlab.baseUrl).toBeDefined();
      expect(typeof config.gitlab.baseUrl).toBe('string');
    });

    it('should have a token property', () => {
      expect(config.gitlab.token).toBeDefined();
      expect(typeof config.gitlab.token).toBe('string');
    });

    it('should parse GITLAB_TEAM_USERS as array', () => {
      expect(Array.isArray(config.gitlab.teamUsers)).toBe(true);
    });

    it('should parse GITLAB_ALLOWED_PROJECTS as array', () => {
      expect(Array.isArray(config.gitlab.allowedProjects)).toBe(true);
    });
  });

  describe('GitHub Configuration', () => {
    it('should have a token property', () => {
      expect(config.github.token).toBeDefined();
      expect(typeof config.github.token).toBe('string');
    });

    it('should have a username property', () => {
      expect(config.github.username).toBeDefined();
      expect(typeof config.github.username).toBe('string');
    });

    it('should parse GITHUB_ALLOWED_REPOS as array', () => {
      expect(Array.isArray(config.github.allowedRepos)).toBe(true);
    });
  });

  describe('Year Configuration', () => {
    it('should have a YEAR property', () => {
      expect(config.year).toBeDefined();
      expect(typeof config.year).toBe('number');
      expect(config.year).toBeGreaterThan(2000);
    });
  });

  describe('API Configuration', () => {
    it('should have a timeout property', () => {
      expect(config.api.timeout).toBeDefined();
      expect(typeof config.api.timeout).toBe('number');
      expect(config.api.timeout).toBeGreaterThan(0);
    });

    it('should have a max retries property', () => {
      expect(config.api.maxRetries).toBeDefined();
      expect(typeof config.api.maxRetries).toBe('number');
      expect(config.api.maxRetries).toBeGreaterThan(0);
    });

    it('should have a per page property', () => {
      expect(config.api.perPage).toBeDefined();
      expect(typeof config.api.perPage).toBe('number');
      expect(config.api.perPage).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    it('should have isGitLabConfigured function', () => {
      expect(typeof config.isGitLabConfigured).toBe('function');
      const result = config.isGitLabConfigured();
      expect(typeof result).toBe('boolean');
    });

    it('should have isGitHubConfigured function', () => {
      expect(typeof config.isGitHubConfigured).toBe('function');
      const result = config.isGitHubConfigured();
      // Result should be falsy or truthy
      expect(result !== undefined).toBe(true);
    });

    it('should have validate function', () => {
      expect(typeof config.validate).toBe('function');
    });
  });

  describe('validate function', () => {
    it('should return true for valid configuration', () => {
      const result = config.validate();
      expect(result).toBe(true);
    });
  });
});
