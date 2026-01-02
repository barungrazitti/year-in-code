# 🎮 Year in Code

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/license-MIT-purple.svg" alt="License">
  <img src="https://img.shields.io/badge/platform-GitLab%20%2F%20GitHub-orange.svg" alt="Platforms">
</p>

<p align="center">
  <i>Turn your GitLab and GitHub activity into a beautiful year-in-review report 🚀</i>
</p>

---

## ✨ What is Year in Code?

**Year in Code** is a powerful CLI tool that transforms your GitLab and GitHub contributions into comprehensive, beautifully formatted markdown reports. Whether you're preparing for annual reviews, showcasing your achievements, or just curious about your coding patterns, Year in Code provides deep insights into your development journey.

### 🎯 Perfect For

- **Annual Performance Reviews** - Show your impact with concrete metrics
- **Portfolio Building** - Showcase your coding activity and contributions
- **Team Retrospectives** - Analyze team productivity and patterns
- **Personal Development** - Understand your coding habits and trends
- **Sprint Planning** - Review past performance to plan better

---

## 🌟 Key Features

### 📊 Multi-Platform Support
- ✅ **GitLab** - Cloud & Self-hosted instances
- ✅ **GitHub** - Full GitHub API integration
- ✅ **Dual Platform** - Combine data from both GitLab and GitHub
- ✅ **Graceful Fallback** - Works with one or both platforms configured

### 👥 Individual & Team Analytics
- ✅ **Single User Reports** - Deep dive into personal contributions
- ✅ **Team Reports** - Aggregate analytics for multiple team members
- ✅ **Per-User Breakdowns** - Individual insights within team reports

### 📈 Comprehensive Metrics

#### Activity Analysis
- Total activities and contributions
- Activity breakdown by type (commits, MRs, issues, reviews, etc.)
- Monthly activity trends with visualizations
- Top projects and repositories

#### Merge Request & Pull Request Analytics
- MRs/PRs created, assigned, and merged
- Average time to merge
- Open vs closed ratios
- Projects with most MR/PR activity

#### Issue Tracking
- Issues created, assigned, and closed
- Resolution rates
- Project-level issue distribution

#### Code Review Insights
- Total code reviews performed
- Review engagement metrics
- Team contribution patterns

#### Time-Based Patterns
- Most productive hours
- Busiest days of the week
- Peak activity months
- Activity heatmaps

#### Streak Analysis
- Longest consecutive coding streak
- Total active days
- Streak periods with dates

### 🔍 Smart Filtering
- Filter by specific projects or repositories
- Case-insensitive partial matching
- Exclude noise by focusing on key projects

### 🎨 Beautiful Output
- Clean, markdown-formatted reports
- ASCII-based activity visualizations
- Personal achievements highlights
- Ready to share on GitHub, Notion, or documentation sites

---

## 🛠 Tech Stack

### Core Technologies
- **Runtime**: Node.js (ES Modules) - `>=14.0.0`
- **Package Manager**: npm or yarn
- **Language**: JavaScript (ES2021+)

### Dependencies
```json
{
  "axios": "^1.6.0",          // HTTP client for API requests
  "dotenv": "^16.6.1"          // Environment variable management
}
```

### APIs & Integrations
- **GitLab REST API** - Events, Projects, Merge Requests, Issues
- **GitHub REST API** - Events, Repositories, Commits
- **GitHub GraphQL API** - Contribution calendar and advanced metrics

### Architecture
- **Modular Design** - Separated concerns for data fetching, analysis, and reporting
- **Async/Await** - Non-blocking API operations
- **Pagination Handling** - Automatic pagination for large datasets
- **Error Handling** - Graceful degradation and detailed error messages
- **Configuration-Driven** - Flexible setup via environment variables

### Code Quality
- **Zero Dependencies** - Minimal external dependencies
- **Type Safety Ready** - Structure supports TypeScript migration
- **Clean Code** - Well-documented functions with JSDoc comments
- **Error Recovery** - Automatic retries and fallback mechanisms

---

## 📦 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn
- GitLab and/or GitHub account with API tokens

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/barungrazitti/year-in-code.git
cd year-in-code

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configure API Tokens

#### GitLab Token Setup
1. Go to GitLab → Settings → Access Tokens
2. Create token with `read_api` scope
3. Add to `.env`:
   ```env
   GITLAB_TOKEN=glpat_xxxxxxxxxxxxxxxxxxxx
   GITLAB_USER_ID=your_username
   ```

#### GitHub Token Setup
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate token with `read:user`, `repo`, and `read:org` scopes
3. Add to `.env`:
   ```env
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   GITHUB_USERNAME=your_username
   ```

---

## 🚀 Quick Start

### Generate Your First Report

```bash
# Basic usage
npm start

# Specify a year
YEAR=2024 npm start

# Focus on specific projects
GITLAB_ALLOWED_PROJECTS=frontend,backend npm start
```

### Output Files

Reports are generated as markdown files:
- `gitlab-year-in-review-{YEAR}.md` - GitLab only
- `github-year-in-review-{YEAR}.md` - GitHub only
- `all-platforms-year-in-review-{YEAR}.md` - Combined
- `team-year-in-review-{YEAR}.md` - Team reports

---

## ⚙️ Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITLAB_TOKEN` | Conditional* | - | GitLab personal access token |
| `GITLAB_USER_ID` | Conditional* | - | GitLab username |
| `GITLAB_TEAM_USERS` | No | - | Comma-separated list of team usernames |
| `GITLAB_BASE_URL` | No | `https://gitlab.com/api/v4` | Self-hosted GitLab API URL |
| `GITLAB_ALLOWED_PROJECTS` | No | - | Comma-separated project names to filter |
| `GITHUB_TOKEN` | Conditional* | - | GitHub personal access token |
| `GITHUB_USERNAME` | Conditional* | - | GitHub username |
| `GITHUB_ALLOWED_REPOS` | No | - | Comma-separated repo names to filter |
| `YEAR` | No | Current year | Year to analyze |
| `OUTPUT_FILENAME` | No | Auto-generated | Custom output filename |
| `API_TIMEOUT` | No | `30000` | API request timeout in ms |
| `PER_PAGE` | No | `100` | Items per API page |
| `MAX_RETRIES` | No | `3` | API retry attempts |

*At least one platform (GitLab or GitHub) must be configured

### Configuration Examples

#### Single User - GitLab Only
```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxx
GITLAB_USER_ID=john.doe
YEAR=2025
```

#### Single User - GitHub Only
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_USERNAME=johndoe
YEAR=2025
```

#### Both Platforms
```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxx
GITLAB_USER_ID=john.doe

GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_USERNAME=johndoe

YEAR=2025
```

#### Team Report
```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxx
GITLAB_TEAM_USERS=alice,bob,charlie,david
YEAR=2025
```

#### Project Filtering
```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxx
GITLAB_USER_ID=john.doe
GITLAB_ALLOWED_PROJECTS=core-platform,mobile-app

GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_USERNAME=johndoe
GITHUB_ALLOWED_REPOS=frontend,backend-api

YEAR=2025
```

---

## 📊 Example Report Output

### Overview Section
```markdown
# Combined Year-in-Review Report - 2025

## Overview

- Total Activities: 2,847
- Projects Involved: 23
```

### GitLab Activity
```markdown
## GitLab Activity

- Total Activities: 1,523
- Projects Involved: 18
- Merge Requests Created: 89
- Merge Requests Assigned: 124
- Issues Created: 156
- Issues Assigned: 203
- Code Reviews: 67
```

### Activity Visualization
```markdown
### GitLab Monthly Activity Chart

January     |████████████████░░| 156
February    |██████████████░░░░| 134
March       |█████████████████| 167
...
```

---

## 💡 Use Cases

### 1. Annual Performance Review
Generate a comprehensive report to share with your manager during performance reviews.

```bash
# Generate report for current year
npm start

# Share the generated markdown file
# Attach to performance review document
```

### 2. Team Retrospective
Analyze team productivity and contributions over a year.

```bash
# Generate team report
GITLAB_TEAM_USERS=alice,bob,charlie npm start
```

### 3. Multi-Year Comparison
Track your growth across multiple years.

```bash
# Generate reports for 3 years
for year in 2023 2024 2025; do
  YEAR=$year npm start
done
```

### 4. Project-Specific Analysis
Focus on contributions to key projects.

```bash
# Analyze specific project
GITLAB_ALLOWED_PROJECTS=core-platform npm start
```

### 5. Portfolio Enhancement
Showcase your coding activity for potential employers.

```bash
# Generate and add to portfolio
YEAR=2024 npm start
# Upload to your portfolio repository
```

---

## 🔍 Advanced Features

### Self-Hosted GitLab
Works with private GitLab instances:

```env
GITLAB_TOKEN=your_token
GITLAB_USER_ID=your_username
GITLAB_BASE_URL=https://gitlab.company.com/api/v4
```

### GraphQL Analytics (GitHub)
Uses GitHub's GraphQL API for enhanced contribution data:
- Contribution calendar
- Commit, issue, PR, and review breakdowns
- Repository contribution metrics

### Intelligent Pagination
Automatically handles large datasets:
- Fetches all pages automatically
- Configurable page size
- Timeout and retry mechanisms

### Error Recovery
Graceful handling of API issues:
- Automatic retries on failures
- Detailed error messages
- Continues with partial data if possible

---

## 📈 Performance

| Scenario | Duration | Memory |
|----------|----------|--------|
| Single User | 10-30 seconds | < 50MB |
| Team (4 users) | 30-60 seconds | < 200MB |
| Large dataset (10k+ events) | 1-2 minutes | < 300MB |
| With project filtering | 5-15 seconds | < 30MB |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Configuration errors | Ensure at least one platform is configured with valid credentials |
| User not found | Verify username is correct (case-sensitive for GitHub) |
| API timeout | Increase `API_TIMEOUT` or reduce `PER_PAGE` in `.env` |
| No data in report | Check that `YEAR` matches your contribution dates |
| Rate limit exceeded | Wait for reset (GitHub: 1 hour) or use authenticated requests |
| 404 on self-hosted GitLab | Verify `GITLAB_BASE_URL` ends with `/api/v4` |
| Permission denied | Check token has required scopes (`read_api` for GitLab, `read:user` for GitHub) |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Development Setup
```bash
# Install dependencies
npm install

# Run tests (if available)
npm test

# Test locally
npm start
```

### Ideas for Contributions
- Add support for more platforms (Bitbucket, Azure DevOps)
- Create HTML/PDF output formats
- Add visualization charts (using libraries like Chart.js)
- Implement web-based reports
- Add more analytics and insights
- Create Docker image for easy deployment

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using Node.js
- Powered by GitLab and GitHub APIs
- Inspired by GitHub's contribution graphs and GitLab's user activity dashboards

---

---

<div align="center">

**Made with ❤️ by [Barun Grazitti](https://github.com/barungrazitti)**

[⬆ Back to Top](#-year-in-code)

</div>
