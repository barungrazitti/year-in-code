import dotenv from 'dotenv';

// Clear environment variables before tests to avoid conflicts with .env file
delete process.env.GITLAB_TOKEN;
delete process.env.GITLAB_USER_ID;
delete process.env.GITLAB_TEAM_USERS;
delete process.env.GITLAB_BASE_URL;
delete process.env.GITLAB_ALLOWED_PROJECTS;
delete process.env.GITHUB_TOKEN;
delete process.env.GITHUB_USERNAME;
delete process.env.GITHUB_USER_ID;
delete process.env.GITHUB_ALLOWED_REPOS;
delete process.env.YEAR;
delete process.env.OUTPUT_FILENAME;
delete process.env.API_TIMEOUT;
delete process.env.MAX_RETRIES;
delete process.env.PER_PAGE;

// Now load dotenv but it will be empty since we deleted everything
dotenv.config();
