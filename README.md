# GitLab/GitHub Year-in-Review

🎯 Generate comprehensive year-in-review reports for your GitLab and/or GitHub activities with detailed analytics, team support, and actionable insights.

**⭐ v1.1.0 - Production Ready**

## ✨ Features

### 📊 Multi-Platform Support

- ✅ GitLab analytics (self-hosted or cloud)
- ✅ GitHub analytics
- ✅ Both platforms simultaneously
- ✅ Graceful degradation if one platform is not configured

### 👥 Individual & Team Analytics

- ✅ Single user performance reports
- ✅ Team aggregated analytics (multi-user reports)
- ✅ Per-user breakdowns in team reports

### 📈 Comprehensive Metrics

- ✅ Activity counts by type, month, and project
- ✅ Merge request/Pull request statistics with average merge time
- ✅ Issue tracking and closure rates
- ✅ Code review activity tracking
- ✅ Contribution streaks and consistency analysis
- ✅ Time-based patterns (hourly, daily, weekly, monthly analysis)
- ✅ Top projects and repositories identification

### 🔍 Project & Repository Filtering

- ✅ Include only specific projects or repositories
- ✅ Case-insensitive matching
- ✅ Partial name matching support

### 🎯 Advanced Analytics

- ✅ Longest activity streak calculation
- ✅ Most active time periods (hour, day, month)
- ✅ Time-to-merge metrics for PRs/MRs
- ✅ Personal achievements summary
- ✅ Multiple output formats (Markdown)

## 📋 Prerequisites

- **Node.js** >= 14.0.0
- **npm** or yarn
- Internet connection to GitLab/GitHub APIs
- At least one of:
  - GitLab personal access token + username
  - GitHub personal access token + username

## 🚀 Quick Start (5 minutes)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd year-in-review
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Credentials

```bash
cp .env.example .env
# Edit .env with your GitLab/GitHub tokens and usernames
nano .env
```

### Step 4: Generate Report

```bash
npm start
```

## ⚙️ Configuration

### Basic Setup - GitLab Only

```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxxxxxxxxx
GITLAB_USER_ID=your_username
YEAR=2025
```

### Basic Setup - GitHub Only

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your_username
YEAR=2025
```

### Advanced Setup - Both Platforms

```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxxxxxxxxx
GITLAB_USER_ID=your_username

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your_username

YEAR=2025
```

### Team Analytics

```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxxxxxxxxx
GITLAB_TEAM_USERS=user1,user2,user3,user4
YEAR=2025
```

### With Project Filtering

```env
GITLAB_TOKEN=glpat_xxxxxxxxxxxxxxxxxxxx
GITLAB_USER_ID=your_username
GITLAB_ALLOWED_PROJECTS=frontend,backend,devops

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your_username
GITHUB_ALLOWED_REPOS=frontend-app,api-server

YEAR=2025
```

For complete configuration options, see [PRODUCTION_README.md](PRODUCTION_README.md).

## 🔐 Getting API Tokens

### GitLab Token

1. Go to your GitLab instance (gitlab.com or self-hosted)
2. Click profile picture → Settings
3. Go to "Access tokens" section
4. Create token with `read_api` scope
5. Copy and save in `.env`

**For Self-Hosted GitLab:**

- Update `GITLAB_BASE_URL` to your instance URL
- Example: `https://gitlab.company.com/api/v4`

### GitHub Token

1. Go to GitHub → Settings → Developer settings
2. Click "Personal access tokens" → "Tokens (classic)"
3. Generate new token with `read:user` scope
4. Copy and save in `.env`

## 📊 Usage & Output

### Generate Report

```bash
npm start
```

### Analyze Different Year

```bash
YEAR=2024 npm start
```

### Output Files

- **GitLab only:** `gitlab-year-in-review-2025.md`
- **GitHub only:** `github-year-in-review-2025.md`
- **Both platforms:** `all-platforms-year-in-review-2025.md`
- **Team:** `team-year-in-review-2025.md`

### Report Contents

The generated markdown report includes:

📌 **Overview**

- Total activities and projects
- Platform breakdown

📌 **Activity Summary**

- By activity type
- By month with counts
- Top 5 projects/repositories

📌 **Merge Requests/Pull Requests**

- Created, assigned, merged counts
- Average time to merge
- Open/closed statistics

📌 **Issues**

- Created, assigned, closed counts
- Resolution statistics

📌 **Code Reviews** (GitLab)

- Total reviews performed
- Engagement metrics

📌 **Time-Based Patterns**

- Most active hour
- Most active day of week
- Most active month

📌 **Activity Streaks**

- Longest consecutive days active
- Total active days in year

📌 **Personal Achievements**

- Top project
- Best streak
- Key milestones

## 📚 Documentation

- **[PRODUCTION_README.md](PRODUCTION_README.md)** - Complete production guide with use cases
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Detailed API reference for all functions
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guidelines for contributing

## 🐛 Troubleshooting

| Issue                       | Solution                                                                        |
| --------------------------- | ------------------------------------------------------------------------------- |
| "Configuration errors"      | Ensure you have GITLAB_TOKEN + GITLAB_USER_ID OR GITHUB_TOKEN + GITHUB_USERNAME |
| "User not found"            | Verify username is correct (case-sensitive for GitHub)                          |
| "API timeout"               | Increase API_TIMEOUT in .env or reduce PER_PAGE                                 |
| "No data in report"         | Check that YEAR matches your contribution dates                                 |
| "Rate limit exceeded"       | Wait for reset (GitHub: 1 hour) or use better token                             |
| "404 on self-hosted GitLab" | Verify GITLAB_BASE_URL ends with `/api/v4`                                      |

## 🌟 Real-World Examples

### Personal Annual Review

```bash
GITLAB_USER_ID=john.doe npm start
```

### Team Retrospective

```bash
GITLAB_TEAM_USERS=alice,bob,charlie YEAR=2025 npm start
```

### Multi-Year Comparison

```bash
for year in 2023 2024 2025; do
  YEAR=$year npm start
done
```

### Focus on Specific Projects

```bash
GITLAB_USER_ID=john.doe \
GITLAB_ALLOWED_PROJECTS=core-platform,mobile \
npm start
```

## 📈 Performance Notes

- **Single user:** ~10-30 seconds
- **Team (4 users):** ~30-60 seconds
- **Large dataset (10k+ events):** Use project filtering
- **Memory usage:** Typically < 50MB per user

## ✅ Quality Checklist

Before sharing generated reports:

- [ ] Verify dates and metrics are correct
- [ ] Check all sections rendered properly
- [ ] Ensure sensitive info is not included
- [ ] Validate for any private project data

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - See LICENSE file for details

---
