# Contributing to Year-in-Review

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Year-in-Review project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Git
- GitLab and/or GitHub accounts for testing

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/year-in-review.git
   cd year-in-review
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_REPO/year-in-review.git
   ```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Create Environment File

```bash
cp .env.example .env.dev
# Edit .env.dev with your test credentials
```

### Run Tests

```bash
npm test
```

### Run the Application

```bash
npm start
```

## Making Changes

### Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-name
```

**Branch naming conventions:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Development Workflow

1. **Make your changes** in the feature branch
2. **Keep commits atomic** - one logical change per commit
3. **Write descriptive commit messages** (see [Commit Messages](#commit-messages))
4. **Test your changes** before pushing
5. **Update documentation** if needed

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npm test -- test-focused.js
```

### Test Configuration

```bash
npm test -- test-config.js
```

### Manual Testing Checklist

Before submitting a PR, test these scenarios:

- [ ] GitLab only configuration
- [ ] GitHub only configuration
- [ ] Both platforms configured
- [ ] Team analytics (multiple users)
- [ ] Project filtering
- [ ] Self-hosted GitLab instance
- [ ] Previous year data (`YEAR=2024`)
- [ ] Missing credentials (should fail gracefully)
- [ ] Invalid tokens (should show appropriate error)

### Testing with Real Credentials

For integration testing, use test tokens with minimal permissions:

1. Create test tokens on GitLab/GitHub
2. Test with real API calls
3. Do not commit test tokens
4. Use `.env.test` file (ignored by git)

## Documentation

### Update README

If your change affects usage, update `README.md`:
- Add new features to the Features section
- Update configuration examples
- Add troubleshooting entries if needed

### Update PRODUCTION_README.md

For significant changes, update `PRODUCTION_README.md`:
- Add use cases if applicable
- Update configuration sections
- Document new capabilities

### Update API_DOCUMENTATION.md

For API changes, update `API_DOCUMENTATION.md`:
- Document new functions with JSDoc format
- Include parameter descriptions
- Provide usage examples

### JSDoc Comments

All functions should have JSDoc comments:

```javascript
/**
 * Brief description of what the function does
 * @async (if applicable)
 * @param {type} paramName - Parameter description
 * @returns {Promise<type>|type} Return value description
 * @throws {Error} Error condition description
 * @example
 * // Example usage
 * const result = await myFunction(param);
 */
async function myFunction(paramName) {
  // Implementation
}
```

## Submitting Changes

### Before You Submit

- [ ] All tests pass locally
- [ ] Code follows project style (see [Coding Standards](#coding-standards))
- [ ] All functions have JSDoc comments
- [ ] Documentation is updated
- [ ] No console.log statements left (use proper logging)
- [ ] No hardcoded values (use config)

### Create a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create a Pull Request
3. Use a clear title following conventions
4. Provide a detailed description:
   - What problem does this solve?
   - How does it work?
   - What are the changes?
   - Any breaking changes?

### PR Title Format

- `feat: Add GitLab project filtering`
- `fix: Handle API timeout correctly`
- `docs: Update configuration guide`
- `refactor: Improve error handling`
- `test: Add integration tests for GitHub API`

### PR Description Template

```markdown
## Description
Brief description of the changes

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested? What scenarios?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Code follows style guide
```

### After Submission

- Respond to review comments promptly
- Make requested changes in new commits
- Avoid force-pushing (unless instructed)
- Be patient and respectful during review

## Coding Standards

### JavaScript Style

Use the existing code style. Key principles:

#### Naming Conventions

```javascript
// Constants
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;

// Functions
async function getUserEvents(userId) {
  // ...
}

// Variables
let activeUsers = [];
const projectMap = new Map();

// Classes (if added)
class GitLabAnalyzer {
  // ...
}
```

#### Code Organization

```javascript
// 1. Imports
import axios from "axios";
import fs from "fs/promises";

// 2. Configuration
const config = {
  // ...
};

// 3. Helper functions
function helperFunction() {
  // ...
}

// 4. Main functions
async function mainFunction() {
  // ...
}
```

#### Error Handling

```javascript
// ✅ Good - descriptive error messages
try {
  const data = await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error.message);
  throw new Error('Data fetch failed: ' + error.message);
}

// ❌ Bad - generic errors
try {
  const data = await fetchData();
} catch (error) {
  console.log('Error');
  throw error;
}
```

#### Async/Await

```javascript
// ✅ Good - use async/await
async function processUsers(userIds) {
  const results = await Promise.all(
    userIds.map(id => getUser(id))
  );
  return results;
}

// ✅ Also good - parallel with error handling
async function processWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries}...`);
    }
  }
}
```

#### Conditionals

```javascript
// ✅ Good - clear and readable
if (config.isGitLabConfigured() && config.isGitHubConfigured()) {
  // Both platforms
}

// ✅ Good - guard clauses
if (!data || data.length === 0) {
  return [];
}

// Early returns make code cleaner
async function processData(data) {
  if (!data) return null;
  if (Array.isArray(data) && data.length === 0) return [];
  
  // Main logic here
}
```

### Code Comments

```javascript
// ✅ Good - explains why, not what
// Users with no activity need to be excluded from
// team analytics to avoid skewing the averages
if (user.activity === 0) continue;

// ❌ Bad - obvious from code
// Loop through users
for (const user of users) {
  // ...
}
```

### Performance Considerations

```javascript
// ✅ Good - cache repeated lookups
const projectCache = new Map();

async function getProjectName(id) {
  if (projectCache.has(id)) {
    return projectCache.get(id);
  }
  const name = await fetchProject(id);
  projectCache.set(id, name);
  return name;
}

// ✅ Good - parallel requests when possible
const [gitlab, github] = await Promise.all([
  getGitLabData(),
  getGitHubData()
]);

// ❌ Avoid - sequential when parallel possible
const gitlab = await getGitLabData();
const github = await getGitHubData();  // Waits unnecessarily
```

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Build, dependencies, etc.

### Scope
Optional but helpful:
- `gitlab` - GitLab-related changes
- `github` - GitHub-related changes
- `config` - Configuration changes
- `api` - API or function changes
- `docs` - Documentation changes

### Subject
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Limit to 50 characters

### Body
- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with blank line

### Examples

```
feat(gitlab): add project-specific filtering

Add support for filtering GitLab events by project names.
Users can now set GITLAB_ALLOWED_PROJECTS to focus on 
specific projects in their reports.

Fixes #123
```

```
fix(github): handle rate limit errors gracefully

Previously, rate limit errors would crash the application.
Now the application waits and retries automatically.

See RFC #456 for rate limit handling strategy
```

```
docs: update configuration examples

Add examples for multi-platform setup and team analytics.
Improve clarity of environment variable descriptions.
```

## Release Process

Maintainers use the following process:

1. Update version in `package.json`
2. Create entry in CHANGELOG.md
3. Create release tag
4. Build and publish

Contributors don't need to worry about this - it's handled by maintainers.

## Getting Help

- 💬 **Questions?** Open a discussion
- 🐛 **Found a bug?** Open an issue with details
- 💡 **Have an idea?** Discuss in an issue first

## Licensing

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Thank You!

Thank you for considering contributing to this project. Your efforts help make Year-in-Review better for everyone! 🙏

---

For more details, see:
- [README.md](README.md) - Project overview
- [PRODUCTION_README.md](PRODUCTION_README.md) - Production guide
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
