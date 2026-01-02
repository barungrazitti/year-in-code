// Configuration file for GitLab Year-in-Review
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

const config = {
  // GitLab API configuration
  gitlab: {
    token: process.env.GITLAB_TOKEN || '',
    baseUrl: process.env.GITLAB_BASE_URL || 'https://gitlab.com/api/v4',
    userId: process.env.GITLAB_USER_ID || '',
    // Support for multiple users
    teamUsers: process.env.GITLAB_TEAM_USERS ? process.env.GITLAB_TEAM_USERS.split(',').map(u => u.trim()) : [],
    // Support for filtering projects by name
    allowedProjects: process.env.GITLAB_ALLOWED_PROJECTS ? process.env.GITLAB_ALLOWED_PROJECTS.split(',').map(proj => proj.trim()) : [],
  },

  // GitHub API configuration
  github: {
    token: process.env.GITHUB_TOKEN || '',
    username: process.env.GITHUB_USERNAME || process.env.GITHUB_USER_ID || '',
    // Support for filtering repositories
    allowedRepos: process.env.GITHUB_ALLOWED_REPOS ? process.env.GITHUB_ALLOWED_REPOS.split(',').map(repo => repo.trim()) : [],
  },

  // Year to analyze (defaults to current year)
  year: process.env.YEAR ? parseInt(process.env.YEAR, 10) : new Date().getFullYear(),

  // Output configuration
  output: {
    get filename() {
      const hasGitLab = this.gitlab && this.gitlab.token && this.gitlab.userId;
      const hasGitHub = this.github && this.github.token && this.github.username;
      const platform = (hasGitLab && hasGitHub) ? 'all-platforms' :
                     hasGitHub ? 'github' : 'gitlab';
      return process.env.OUTPUT_FILENAME || `${platform}-year-in-review-${process.env.YEAR || new Date().getFullYear()}.md`;
    },
    format: process.env.OUTPUT_FORMAT || 'markdown', // markdown, json
  },

  // API request configuration
  api: {
    timeout: parseInt(process.env.API_TIMEOUT, 10) || 30000, // 30 seconds
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    perPage: parseInt(process.env.PER_PAGE, 10) || 100,
  },

  // Helper function to check if GitLab is properly configured
  isGitLabConfigured: function() {
    return this.gitlab.token && (this.gitlab.userId || this.gitlab.teamUsers.length > 0);
  },

  // Helper function to check if GitHub is properly configured
  isGitHubConfigured: function() {
    return this.github.token && this.github.username;
  },

  // Validation function
  validate: function() {
    const errors = [];

    // Check if at least one platform is configured
    const hasGitLab = this.isGitLabConfigured();
    const hasGitHub = this.isGitHubConfigured();

    if (!hasGitLab && !hasGitHub) {
      errors.push('At least one platform must be configured:');
      errors.push('  - GitLab: GITLAB_TOKEN and either GITLAB_USER_ID or GITLAB_TEAM_USERS');
      errors.push('  - GitHub: GITHUB_TOKEN and GITHUB_USERNAME');
    }

    if (isNaN(this.year) || this.year < 2000 || this.year > new Date().getFullYear() + 1) {
      errors.push('YEAR must be a valid year between 2000 and next year');
    }

    if (errors.length > 0) {
      throw new Error('Configuration errors:\n' + errors.join('\n'));
    }

    return true;
  }
};

export default config;