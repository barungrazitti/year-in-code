import axios from "axios";
import fs from "fs/promises";
import path from "path";
import config from "./config.js";

// Validate configuration
config.validate();

// GitLab API client - only create if GitLab is configured
let gitlabClient = null;
if (config.isGitLabConfigured()) {
    gitlabClient = axios.create({
        baseURL: config.gitlab.baseUrl,
        headers: { "PRIVATE-TOKEN": config.gitlab.token },
        timeout: config.api.timeout
    });
}

// GitHub API client - only create if GitHub is configured
let githubClient = null;
if (config.isGitHubConfigured()) {
    githubClient = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `token ${config.github.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitLab-GitHub-Year-in-Review'
        },
        timeout: config.api.timeout
    });
}

/**
 * Fetches all GitLab events for a user within the configured year
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of GitLab event objects
 * @throws {Error} If API call fails after retries
 */
async function getEvents(userId) {
    try {
        const params = {
            after: `${config.year}-01-01`,
            before: `${config.year}-12-31`
        };

        const events = await fetchAllPages(`/users/${userId}/events`, params);
        console.log(`Fetched ${events.length} total events for user ${userId}`);
        return events;
    } catch (error) {
        handleApiError('events', error);
        throw error;
    }
}

/**
 * Fetches the authenticated user's details from GitLab
 * @async
 * @returns {Promise<Object|null>} User details object or null if not found
 */
async function getUserDetails() {
    try {
        const res = await gitlabClient.get(`/users?username=${config.gitlab.userId}`);
        if (res.data && res.data.length > 0) {
            return res.data[0]; // Get the first user that matches the username
        }
        return null;
    } catch (error) {
        handleApiError('user details', error);
        throw error;
    }
}

/**
 * Fetches all GitLab projects where the user is a member
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of project objects
 */
async function getUserProjects(userId) {
    try {
        const params = {
            membership: true // Only projects where user is a member
        };

        const projects = await fetchAllPages(`/users/${userId}/projects`, params);
        console.log(`Fetched ${projects.length} total projects for user ${userId}`);
        return projects;
    } catch (error) {
        handleApiError('user projects', error);
        return [];
    }
}

/**
 * Fetches all merge requests created by the user in the configured year
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of merge request objects
 */
async function getUserMergeRequests(userId) {
    try {
        const params = {
            author_id: userId,
            created_after: `${config.year}-01-01`,
            created_before: `${config.year}-12-31`
        };

        const mergeRequests = await fetchAllPages(`/merge_requests`, params);
        console.log(`Fetched ${mergeRequests.length} total merge requests created by user ${userId}`);
        return mergeRequests;
    } catch (error) {
        handleApiError('merge requests', error);
        return [];
    }
}

/**
 * Fetches all merge requests assigned to the user in the configured year
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of merge request objects
 */
async function getUserAssignedMergeRequests(userId) {
    try {
        const params = {
            assignee_id: userId,
            created_after: `${config.year}-01-01`,
            created_before: `${config.year}-12-31`
        };

        const assignedMergeRequests = await fetchAllPages(`/merge_requests`, params);
        console.log(`Fetched ${assignedMergeRequests.length} total merge requests assigned to user ${userId}`);
        return assignedMergeRequests;
    } catch (error) {
        handleApiError('assigned merge requests', error);
        return [];
    }
}

/**
 * Fetches all issues created by the user in the configured year
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of issue objects
 */
async function getUserIssues(userId) {
    try {
        const params = {
            author_id: userId,
            created_after: `${config.year}-01-01`,
            created_before: `${config.year}-12-31`
        };

        const issues = await fetchAllPages(`/issues`, params);
        console.log(`Fetched ${issues.length} total issues created by user ${userId}`);
        return issues;
    } catch (error) {
        handleApiError('issues', error);
        return [];
    }
}

/**
 * Fetches all issues assigned to the user in the configured year
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of issue objects
 */
async function getUserAssignedIssues(userId) {
    try {
        const params = {
            assignee_id: userId,
            created_after: `${config.year}-01-01`,
            created_before: `${config.year}-12-31`
        };

        const assignedIssues = await fetchAllPages(`/issues`, params);
        console.log(`Fetched ${assignedIssues.length} total issues assigned to user ${userId}`);
        return assignedIssues;
    } catch (error) {
        handleApiError('assigned issues', error);
        return [];
    }
}

/**
 * Fetches merge requests where the user was involved as a reviewer/approver
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @returns {Promise<Array>} Array of merge request objects where user was a reviewer
 */
async function getUserCodeReviews(userId) {
    try {
        // GitLab doesn't have a direct API for reviewers, but we can look for merge requests
        // where the user was involved in review/approval process
        // We'll look for MRs where the user commented or was mentioned

        // Get all merge requests where the user was mentioned as assignee, reviewer, or author
        // This approach looks for MRs where the user was involved but not as the author
        const params = {
            updated_after: `${config.year}-01-01`,
            updated_before: `${config.year}-12-31`
        };

        // Fetch all merge requests updated in the year
        const allMRs = await fetchAllPages(`/merge_requests`, params);

        // Filter for MRs where the user was involved in review (not author)
        // In GitLab, reviewers are often assignees or mentioned in the MR
        const reviewMRs = allMRs.filter(mr => {
            // Exclude MRs authored by the user
            if (mr.author && mr.author.id === userId) {
                return false;
            }

            // Check if user was an assignee (often means they were reviewing)
            if (mr.assignees && Array.isArray(mr.assignees)) {
                return mr.assignees.some(assignee => assignee.id === userId);
            }

            // If no assignees, check if user was mentioned in the MR description
            if (mr.description && mr.description.includes(`@${config.gitlab.userId}`)) {
                return true;
            }

            return false;
        });

        console.log(`Fetched ${reviewMRs.length} merge requests reviewed by user ${userId}`);
        return reviewMRs;
    } catch (error) {
        handleApiError('code reviews', error);
        return [];
    }
}

/**
 * Fetches the name of a GitLab project by its ID
 * @async
 * @param {number} projectId - The GitLab project ID
 * @returns {Promise<string>} Project name or fallback identifier
 */
async function getProjectNameById(projectId) {
    try {
        const response = await gitlabClient.get(`/projects/${projectId}`);
        return response.data.name || response.data.path_with_namespace || `Project-${projectId}`;
    } catch (error) {
        handleApiError(`project ${projectId}`, error);
        return `Project-${projectId}`; // Fallback to ID if can't fetch name
    }
}

/**
 * Analyzes GitLab events and extracts comprehensive metrics
 * @async
 * @param {Array} events - Array of GitLab event objects
 * @returns {Promise<Object>} Metrics including activity types, projects, monthly data, and top projects
 */
async function analyzeEvents(events) {
    const metrics = {
        totalEvents: events.length,
        eventTypeCounts: {},
        projectActivity: {},
        monthlyActivity: {},
        topProjects: [],
        mostActiveMonth: '',
        projectContributions: {} // Track detailed contributions per project
    };

    // Create a map of project IDs to project names to avoid duplicate API calls
    const projectNamesMap = new Map();

    for (const event of events) {
        // Filter by allowed projects if configured
        if (config.gitlab.allowedProjects && config.gitlab.allowedProjects.length > 0 && event.project_id) {
            // We'll check the project name after fetching it
            // For now, continue and filter after name lookup
        }

        // Count event types
        const eventType = event.action_name;
        metrics.eventTypeCounts[eventType] = (metrics.eventTypeCounts[eventType] || 0) + 1;

        // Count project activity - get actual project name
        let projectName = 'Unknown Project';
        if (event.project_id) {
            // Check if we already have the project name
            if (projectNamesMap.has(event.project_id)) {
                projectName = projectNamesMap.get(event.project_id);
            } else {
                // Fetch the project name and cache it
                projectName = await getProjectNameById(event.project_id);
                projectNamesMap.set(event.project_id, projectName);
            }
        }

        // Filter by allowed projects if configured
        if (config.gitlab.allowedProjects && config.gitlab.allowedProjects.length > 0) {
            const isAllowed = config.gitlab.allowedProjects.some(allowed => 
                projectName.toLowerCase().includes(allowed.toLowerCase()) ||
                allowed.toLowerCase().includes(projectName.toLowerCase())
            );
            if (!isAllowed) {
                continue; // Skip this event if project is not in allowed list
            }
        }

        metrics.projectActivity[projectName] = (metrics.projectActivity[projectName] || 0) + 1;

        // Track detailed project contributions
        if (!metrics.projectContributions[projectName]) {
            metrics.projectContributions[projectName] = {
                total: 0,
                pushEvents: 0,
                otherEvents: 0
            };
        }

        metrics.projectContributions[projectName].total++;

        if (eventType.includes('push')) {
            metrics.projectContributions[projectName].pushEvents++;
        } else {
            metrics.projectContributions[projectName].otherEvents++;
        }

        // Count monthly activity
        const eventDate = new Date(event.created_at);
        const month = eventDate.toLocaleString('default', { month: 'long' });
        metrics.monthlyActivity[month] = (metrics.monthlyActivity[month] || 0) + 1;
    }

    // Get top projects by activity
    metrics.topProjects = Object.entries(metrics.projectActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([project, count]) => ({ project, count }));

    // Get most active month
    const mostActive = Object.entries(metrics.monthlyActivity)
        .sort(([,a], [,b]) => b - a)[0];
    metrics.mostActiveMonth = mostActive ? mostActive[0] : '';

    return metrics;
}

/**
 * Analyzes merge request data and extracts metrics
 * @param {Array} mrs - Array of merge request objects
 * @returns {Object} Metrics including merged count, average time to merge, etc.
 */
function analyzeMergeRequests(mrs) {
    const metrics = {
        totalCreated: mrs.length,
        totalAssigned: 0, // This will be updated separately
        mergedCount: 0,
        openedCount: 0,
        closedCount: 0,
        averageTimeToMerge: 0,
        totalTimeToMerge: 0,
        projectsWithMRs: new Set()
    };

    mrs.forEach(mr => {
        metrics.projectsWithMRs.add(mr.project_id);

        if (mr.state === 'merged') {
            metrics.mergedCount++;
            // Calculate time to merge if available
            if (mr.merged_at && mr.created_at) {
                const created = new Date(mr.created_at);
                const merged = new Date(mr.merged_at);
                const timeDiff = merged - created; // in milliseconds
                metrics.totalTimeToMerge += timeDiff;
            }
        } else if (mr.state === 'opened') {
            metrics.openedCount++;
        } else if (mr.state === 'closed') {
            metrics.closedCount++;
        }
    });

    if (metrics.mergedCount > 0) {
        metrics.averageTimeToMerge = metrics.totalTimeToMerge / metrics.mergedCount;
    }

    metrics.projectsWithMRs = Array.from(metrics.projectsWithMRs);

    return metrics;
}

/**
 * Analyzes issue data and extracts metrics
 * @param {Array} issues - Array of issue objects
 * @returns {Object} Metrics including closed count, open count, etc.
 */
function analyzeIssues(issues) {
    const metrics = {
        totalCreated: issues.length,
        totalAssigned: 0, // This will be updated separately
        closedCount: 0,
        openedCount: 0,
        projectsWithIssues: new Set()
    };

    issues.forEach(issue => {
        metrics.projectsWithIssues.add(issue.project_id);

        if (issue.state === 'closed') {
            metrics.closedCount++;
        } else {
            metrics.openedCount++;
        }
    });

    metrics.projectsWithIssues = Array.from(metrics.projectsWithIssues);

    return metrics;
}

/**
 * Analyzes time-based patterns in events (hourly, daily, weekly, monthly)
 * @param {Array} events - Array of event objects
 * @returns {Object} Time-based activity metrics
 */
function analyzeTimePatterns(events) {
    const timeMetrics = {
        hourlyActivity: {}, // 0-23 hours
        dailyActivity: {}, // 0-6 days (Sunday-Saturday)
        weeklyActivity: {}, // Week number of the year
        monthlyActivity: {} // Month names
    };

    events.forEach(event => {
        const date = new Date(event.created_at);

        // Hour of day (0-23)
        const hour = date.getHours();
        timeMetrics.hourlyActivity[hour] = (timeMetrics.hourlyActivity[hour] || 0) + 1;

        // Day of week (0-6, Sunday-Saturday)
        const dayOfWeek = date.getDay();
        timeMetrics.dailyActivity[dayOfWeek] = (timeMetrics.dailyActivity[dayOfWeek] || 0) + 1;

        // Week of year
        const weekNumber = getWeekNumber(date);
        timeMetrics.weeklyActivity[weekNumber] = (timeMetrics.weeklyActivity[weekNumber] || 0) + 1;

        // Month
        const month = date.toLocaleString('default', { month: 'long' });
        timeMetrics.monthlyActivity[month] = (timeMetrics.monthlyActivity[month] || 0) + 1;
    });

    return timeMetrics;
}

/**
 * Calculates the ISO week number for a given date
 * @param {Date} d - The date to calculate week number for
 * @returns {number} ISO week number (1-53)
 */
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Analyzes activity streaks and consecutive active days
 * @param {Array} events - Array of event objects
 * @returns {Object} Streak metrics including longest streak and total active days
 */
function analyzeStreaks(events) {
    // Group events by date
    const eventsByDate = {};

    events.forEach(event => {
        const date = new Date(event.created_at);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!eventsByDate[dateStr]) {
            eventsByDate[dateStr] = [];
        }
        eventsByDate[dateStr].push(event);
    });

    // Get sorted list of active dates
    const activeDates = Object.keys(eventsByDate).sort();

    // Find the longest streak
    let currentStreak = 0;
    let maxStreak = 0;
    let currentStreakStart = null;
    let maxStreakStart = null;
    let maxStreakEnd = null;

    for (let i = 0; i < activeDates.length; i++) {
        if (i === 0) {
            currentStreak = 1;
            currentStreakStart = activeDates[i];
        } else {
            const prevDate = new Date(activeDates[i-1]);
            const currDate = new Date(activeDates[i]);

            // Calculate difference in days
            const diffTime = currDate - prevDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                currentStreak++;
            } else if (diffDays > 1) {
                // Streak broken
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                    maxStreakStart = currentStreakStart;
                    maxStreakEnd = activeDates[i-1];
                }
                currentStreak = 1;
                currentStreakStart = activeDates[i];
            }
        }
    }

    // Check the final streak
    if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        maxStreakStart = currentStreakStart;
        maxStreakEnd = activeDates[activeDates.length - 1];
    }

    return {
        maxStreak,
        maxStreakStart,
        maxStreakEnd,
        totalActiveDays: activeDates.length
    };
}

/**
 * Aggregates user activity from GitLab and/or GitHub platforms
 * @async
 * @param {string} userId - The GitLab user ID or username
 * @param {number} year - The year to analyze
 * @returns {Promise<Object>} Comprehensive activity summary from configured platforms
 * @throws {Error} If no platforms are configured or all data fetching fails
 */
async function getUserActivitySummary(userId, year) {
    try {
        // Fetch GitLab data if configured
        let gitlabData = null;
        if (config.isGitLabConfigured()) {
            console.log(`Fetching GitLab activity for user: ${userId}, year: ${year}`);
            
            try {
                // Fetch GitLab data concurrently
                const [
                    userDetails,
                    events,
                    projects,
                    createdMRs,
                    assignedMRs,
                    createdIssues,
                    assignedIssues,
                    codeReviews
                ] = await Promise.all([
                    getUserDetails(),
                    getEvents(userId),
                    getUserProjects(userId),
                    getUserMergeRequests(userId),
                    getUserAssignedMergeRequests(userId),
                    getUserIssues(userId),
                    getUserAssignedIssues(userId),
                    getUserCodeReviews(userId)
                ]);

                // Analyze GitLab data
                const eventMetrics = await analyzeEvents(events);
                const mrMetrics = analyzeMergeRequests(createdMRs);
                mrMetrics.totalAssigned = assignedMRs.length;
                const issueMetrics = analyzeIssues(createdIssues);
                issueMetrics.totalAssigned = assignedIssues.length;
                const timeMetrics = analyzeTimePatterns(events);
                const streakMetrics = analyzeStreaks(events);

                // Get unique project IDs from events to fetch project details
                const projectIdsFromEvents = [...new Set(events.map(event => event.project_id).filter(id => id))];
                let projectDetailsFromEvents = [];

                // Fetch project details for projects found in events
                for (const projectId of projectIdsFromEvents) {
                    try {
                        const project = await getProjectNameById(projectId);
                        if (project && !projectDetailsFromEvents.some(p => p.id === projectId)) {
                            projectDetailsFromEvents.push({ id: projectId, name: project });
                        }
                    } catch (error) {
                        console.log(`Could not fetch details for project ${projectId}:`, error.message);
                    }
                }

                // Combine user projects and projects from events, ensuring unique projects
                const allProjectsMap = new Map();
                [...projects, ...projectDetailsFromEvents].forEach(p => {
                    if (!allProjectsMap.has(p.id)) {
                        allProjectsMap.set(p.id, p);
                    }
                });
                const allProjects = Array.from(allProjectsMap.values());

                gitlabData = {
                    user: userDetails ? {
                        id: userDetails.id,
                        name: userDetails.name,
                        username: userDetails.username,
                        email: userDetails.email
                    } : null,
                    events: eventMetrics,
                    mergeRequests: mrMetrics,
                    issues: issueMetrics,
                    codeReviews: {
                        totalReviewed: codeReviews.length
                    },
                    timePatterns: timeMetrics,
                    streaks: streakMetrics,
                    projects: {
                        total: allProjects.length,
                        names: allProjects.map(p => p.name || `Project-${p.id}`)
                    },
                    overall: {
                        totalActivities: eventMetrics.totalEvents,
                        totalProjects: allProjects.length,
                        totalCreatedMRs: createdMRs.length,
                        totalAssignedMRs: assignedMRs.length,
                        totalCreatedIssues: createdIssues.length,
                        totalAssignedIssues: assignedIssues.length
                    }
                };
            } catch (error) {
                console.error('Error fetching GitLab data:', error.message);
                throw error;
            }
        }

        // Fetch GitHub data if configured
        let githubData = null;
        if (config.isGitHubConfigured()) {
            console.log(`Fetching GitHub activity for user: ${config.github.username}, year: ${year}`);
            
            try {
                const [githubEvents, githubCommits, githubUserDetails, githubContributions] = await Promise.all([
                    getGitHubUserActivity(config.github.username, year),
                    getGitHubUserCommits(config.github.username, year),
                    getGitHubUserDetails(config.github.username),
                    getGitHubContributions(config.github.username, year)
                ]);

                const githubEventMetrics = analyzeGitHubEvents(githubEvents, githubCommits);
                const githubTimeMetrics = analyzeGitHubTimePatterns(githubEvents);
                const githubStreakMetrics = analyzeGitHubStreaks(githubEvents);

                githubData = {
                    events: githubEventMetrics,
                    timePatterns: githubTimeMetrics,
                    streaks: githubStreakMetrics,
                    user: githubUserDetails,
                    commits: githubCommits.length,
                    contributions: githubContributions
                };
            } catch (error) {
                console.error('Error fetching GitHub data:', error.message);
                throw error;
            }
        }

        // If neither platform has data, throw error
        if (!gitlabData && !githubData) {
            throw new Error('No data available from configured platforms');
        }

        // Combine all metrics
        const summary = {
            year: year,
            gitlab: gitlabData,
            github: githubData,
            overall: {
                totalActivities: (gitlabData?.overall?.totalActivities || 0) + (githubData?.events?.totalEvents || 0),
                totalProjects: (gitlabData?.overall?.totalProjects || 0) + (githubData?.events?.totalRepos?.length || 0)
            }
        };

        return summary;
    } catch (error) {
        console.error('Error getting user activity summary:', error);
        throw error;
    }
}

/**
 * Generates a formatted markdown year-in-review report
 * @param {Object} summary - Activity summary object from getUserActivitySummary
 * @returns {string} Formatted markdown report
 */
function generateYearInReviewReport(summary) {
    const { user, year, gitlab, github, overall } = summary;

    let report = `# Combined Year-in-Review Report - ${year}\n\n`;

    if (user) {
        report += `## User: ${user.name} (@${user.username})\n\n`;
    }

    report += `## Overview\n\n`;
    report += `- Total Activities: ${overall.totalActivities}\n`;
    report += `- Projects Involved: ${overall.totalProjects}\n\n`;

    // GitLab section
    if (gitlab) {
        report += `## GitLab Activity\n\n`;
        report += `- Total Activities: ${gitlab.overall.totalActivities}\n`;
        report += `- Projects Involved: ${gitlab.overall.totalProjects}\n`;
        report += `- Merge Requests Created: ${gitlab.overall.totalCreatedMRs}\n`;
        report += `- Merge Requests Assigned: ${gitlab.overall.totalAssignedMRs}\n`;
        report += `- Issues Created: ${gitlab.overall.totalCreatedIssues}\n`;
        report += `- Issues Assigned: ${gitlab.overall.totalAssignedIssues}\n`;
        report += `- Code Reviews: ${gitlab.codeReviews.totalReviewed}\n\n`;

        report += `### GitLab Activity Summary\n\n`;

        // Event type breakdown
        report += `#### By Activity Type\n\n`;
        for (const [type, count] of Object.entries(gitlab.events.eventTypeCounts)) {
            report += `- ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${count}\n`;
        }
        report += `\n`;

        // Monthly activity
        report += `#### By Month\n\n`;
        for (const [month, count] of Object.entries(gitlab.events.monthlyActivity)) {
            report += `- ${month}: ${count} activities\n`;
        }
        report += `\n`;

        // Top projects
        report += `#### Top Projects\n\n`;
        gitlab.events.topProjects.forEach((project, index) => {
            report += `${index + 1}. ${project.project}: ${project.count} activities\n`;
        });
        report += `\n`;

        report += `### GitLab Merge Requests\n\n`;
        report += `- Created: ${gitlab.mergeRequests.totalCreated}\n`;
        report += `- Assigned: ${gitlab.mergeRequests.totalAssigned}\n`;
        report += `- Merged: ${gitlab.mergeRequests.mergedCount}\n`;
        report += `- Opened: ${gitlab.mergeRequests.openedCount}\n`;
        report += `- Closed: ${gitlab.mergeRequests.closedCount}\n`;
        if (gitlab.mergeRequests.averageTimeToMerge > 0) {
            const avgDays = Math.round(gitlab.mergeRequests.averageTimeToMerge / (1000 * 60 * 60 * 24));
            report += `- Average Time to Merge: ${avgDays} days\n`;
        }
        report += `- Projects with MRs: ${gitlab.mergeRequests.projectsWithMRs.length}\n\n`;

        report += `### GitLab Issues\n\n`;
        report += `- Created: ${gitlab.issues.totalCreated}\n`;
        report += `- Assigned: ${gitlab.issues.totalAssigned}\n`;
        report += `- Closed: ${gitlab.issues.closedCount}\n`;
        report += `- Open: ${gitlab.issues.openedCount}\n`;
        report += `- Projects with Issues: ${gitlab.issues.projectsWithIssues.length}\n\n`;

        report += `### GitLab Code Reviews\n\n`;
        report += `- Total Reviews: ${gitlab.codeReviews.totalReviewed}\n\n`;

        report += `### GitLab Projects\n\n`;
        report += `- Total Projects: ${gitlab.projects.total}\n`;
        report += `- Project Names: ${gitlab.projects.names.slice(0, 10).join(', ')}${gitlab.projects.names.length > 10 ? '...' : ''}\n\n`;

        report += `### GitLab Project Contributions\n\n`;
        for (const [projectName, contrib] of Object.entries(gitlab.events.projectContributions)) {
            if (projectName !== 'Unknown Project') { // Skip unknown projects for detailed view
                report += `- **${projectName}**: ${contrib.total} activities (${contrib.pushEvents} pushes, ${contrib.otherEvents} other)\n`;
            }
        }
        if (Object.keys(gitlab.events.projectContributions).filter(p => p !== 'Unknown Project').length === 0) {
            report += `- No specific project contributions identified\n`;
        }
        report += `\n`;

        report += `### GitLab Time-Based Patterns\n\n`;
        report += `#### Most Active Hour\n\n`;
        const gitlabMostActiveHour = Object.entries(gitlab.timePatterns.hourlyActivity).sort(([,a], [,b]) => b - a)[0];
        if (gitlabMostActiveHour) {
            report += `- Hour ${gitlabMostActiveHour[0]}: ${gitlabMostActiveHour[1]} activities\n`;
        }

        report += `\n#### Most Active Day of Week\n\n`;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const gitlabMostActiveDay = Object.entries(gitlab.timePatterns.dailyActivity).sort(([,a], [,b]) => b - a)[0];
        if (gitlabMostActiveDay) {
            report += `- ${dayNames[gitlabMostActiveDay[0]]}: ${gitlabMostActiveDay[1]} activities\n`;
        }

        report += `\n#### Most Active Month\n\n`;
        const gitlabMostActiveMonth = Object.entries(gitlab.timePatterns.monthlyActivity).sort(([,a], [,b]) => b - a)[0];
        if (gitlabMostActiveMonth) {
            report += `- ${gitlabMostActiveMonth[0]}: ${gitlabMostActiveMonth[1]} activities\n`;
        }
        report += `\n`;

        report += `### GitLab Streaks & Consistency\n\n`;
        report += `- Longest Activity Streak: ${gitlab.streaks.maxStreak} days\n`;
        if (gitlab.streaks.maxStreakStart && gitlab.streaks.maxStreakEnd) {
            report += `- Streak Period: ${gitlab.streaks.maxStreakStart} to ${gitlab.streaks.maxStreakEnd}\n`;
        }
        report += `- Total Active Days: ${gitlab.streaks.totalActiveDays} days\n\n`;

        // GitLab personal achievements
        report += `### GitLab Personal Achievements\n\n`;
        report += `- Most Active Month: ${gitlab.events.mostActiveMonth}\n`;
        if (gitlab.events.topProjects.length > 0) {
            report += `- Top Project: ${gitlab.events.topProjects[0].project}\n`;
        }
        if (gitlab.mergeRequests.mergedCount > 0) {
            report += `- Merge Requests Merged: ${gitlab.mergeRequests.mergedCount}\n`;
        }
        if (gitlab.issues.closedCount > 0) {
            report += `- Issues Closed: ${gitlab.issues.closedCount}\n`;
        }
        if (gitlab.codeReviews.totalReviewed > 0) {
            report += `- Code Reviews Performed: ${gitlab.codeReviews.totalReviewed}\n`;
        }
        if (gitlab.streaks.maxStreak > 1) {
            report += `- Best Activity Streak: ${gitlab.streaks.maxStreak} consecutive days\n`;
        }
        report += `\n`;
    }

    // GitHub section
    if (github) {
        report += `## GitHub Activity\n\n`;
        report += `- Total Events: ${github.events?.totalEvents || 0}\n`;
        report += `- Total Commits: ${github.commits || 0}\n`;
        report += `- Total Contributions: ${github.contributions?.total || 0}\n\n`;

        if (github.events) {
            report += `### GitHub Activity Summary\n\n`;

            // Event type breakdown
            report += `#### By Activity Type\n\n`;
            for (const [type, count] of Object.entries(github.events.eventTypeCounts)) {
                report += `- ${type.replace(/Event$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${count}\n`;
            }
            report += `\n`;

            // Monthly activity
            report += `#### By Month\n\n`;
            for (const [month, count] of Object.entries(github.events.monthlyActivity)) {
                report += `- ${month}: ${count} activities\n`;
            }
            report += `\n`;

            // Top repos
            report += `#### Top Repositories\n\n`;
            github.events.topRepos.forEach((repo, index) => {
                report += `${index + 1}. ${repo.repo}: ${repo.count} activities\n`;
            });
            report += `\n`;

            report += `### GitHub Repository Contributions\n\n`;
            for (const [repoName, contrib] of Object.entries(github.events.contributions)) {
                report += `- **${repoName}**: ${contrib.total} activities (${contrib.pushEvents} pushes, ${contrib.otherEvents} other)\n`;
            }
            report += `\n`;
        }

        // GitHub contributions data if available
        if (github.contributions) {
            report += `### GitHub Contribution Summary\n\n`;
            report += `- Total Contributions: ${github.contributions.total}\n`;

            // Add detailed contribution breakdown if available
            if (github.contributions.totalCommits !== undefined) {
                report += `- Commit Contributions: ${github.contributions.totalCommits}\n`;
                report += `- Issue Contributions: ${github.contributions.totalIssues}\n`;
                report += `- Pull Request Contributions: ${github.contributions.totalPullRequests}\n`;
                report += `- Review Contributions: ${github.contributions.totalReviews}\n`;
                report += `- Repository Contributions: ${github.contributions.totalRepositories}\n`;
            }

            // Top repositories by contribution (only if using fallback method)
            if (github.contributions.byRepo) {
                const topRepos = Object.entries(github.contributions.byRepo)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);

                if (topRepos.length > 0) {
                    report += `- Top Contributed Repositories:\n`;
                    topRepos.forEach(([repo, count], index) => {
                        report += `  ${index + 1}. ${repo}: ${count} contributions\n`;
                    });
                }
            }

            // Contribution types (only if using fallback method)
            if (github.contributions.byType) {
                const contributionTypes = Object.entries(github.contributions.byType)
                    .sort(([,a], [,b]) => b - a);

                if (contributionTypes.length > 0) {
                    report += `- Contribution Types:\n`;
                    contributionTypes.forEach(([type, count]) => {
                        report += `  - ${type.replace(/Event$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${count}\n`;
                    });
                }
            }
            report += `\n`;
        }

        report += `### GitHub Time-Based Patterns\n\n`;
        report += `#### Most Active Hour\n\n`;
        const githubMostActiveHour = Object.entries(github.timePatterns.hourlyActivity).sort(([,a], [,b]) => b - a)[0];
        if (githubMostActiveHour) {
            report += `- Hour ${githubMostActiveHour[0]}: ${githubMostActiveHour[1]} activities\n`;
        }

        report += `\n#### Most Active Day of Week\n\n`;
        const githubMostActiveDay = Object.entries(github.timePatterns.dailyActivity).sort(([,a], [,b]) => b - a)[0];
        if (githubMostActiveDay) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            report += `- ${dayNames[githubMostActiveDay[0]]}: ${githubMostActiveDay[1]} activities\n`;
        }

        report += `\n#### Most Active Month\n\n`;
        const githubMostActiveMonth = Object.entries(github.timePatterns.monthlyActivity).sort(([,a], [,b]) => b - a)[0];
        if (githubMostActiveMonth) {
            report += `- ${githubMostActiveMonth[0]}: ${githubMostActiveMonth[1]} activities\n`;
        }
        report += `\n`;

        report += `### GitHub Streaks & Consistency\n\n`;
        report += `- Longest Activity Streak: ${github.streaks.maxStreak} days\n`;
        if (github.streaks.maxStreakStart && github.streaks.maxStreakEnd) {
            report += `- Streak Period: ${github.streaks.maxStreakStart} to ${github.streaks.maxStreakEnd}\n`;
        }
        report += `- Total Active Days: ${github.streaks.totalActiveDays} days\n\n`;

        // GitHub personal achievements
        report += `### GitHub Personal Achievements\n\n`;
        report += `- Most Active Month: ${github.events.mostActiveMonth}\n`;
        if (github.events.topRepos.length > 0) {
            report += `- Top Repository: ${github.events.topRepos[0].repo}\n`;
        }
        if (github.contributions?.total > 0) {
            report += `- Total Contributions: ${github.contributions.total}\n`;
        }
        if (github.streaks.maxStreak > 1) {
            report += `- Best Activity Streak: ${github.streaks.maxStreak} consecutive days\n`;
        }
        report += `\n`;
    }

    // Combined achievements
    report += `## Combined Personal Achievements\n\n`;
    if (gitlab?.events?.mostActiveMonth) {
        report += `- Most Active Month (GitLab): ${gitlab.events.mostActiveMonth}\n`;
    }
    if (github?.events?.mostActiveMonth) {
        report += `- Most Active Month (GitHub): ${github.events.mostActiveMonth}\n`;
    }
    if (gitlab?.events?.topProjects.length > 0) {
        report += `- Top GitLab Project: ${gitlab.events.topProjects[0].project}\n`;
    }
    if (github?.events?.topRepos.length > 0) {
        report += `- Top GitHub Repository: ${github.events.topRepos[0].repo}\n`;
    }
    if (gitlab?.codeReviews.totalReviewed > 0) {
        report += `- GitLab Code Reviews Performed: ${gitlab.codeReviews.totalReviewed}\n`;
    }
    if (gitlab?.streaks.maxStreak > 1) {
        report += `- Best GitLab Activity Streak: ${gitlab.streaks.maxStreak} consecutive days\n`;
    }
    if (github?.streaks.maxStreak > 1) {
        report += `- Best GitHub Activity Streak: ${github.streaks.maxStreak} consecutive days\n`;
    }

    return report;
}

/**
 * Helper function to fetch all paginated results from an API endpoint
 * @async
 * @param {string} url - API endpoint URL
 * @param {Object} params - Query parameters
 * @param {number} [maxPages=100] - Maximum number of pages to fetch
 * @param {Object} [clientToUse=gitlabClient] - Axios client instance to use
 * @returns {Promise<Array>} All results from all pages combined
 */
async function fetchAllPages(url, params, maxPages = 100, clientToUse = gitlabClient) {
    let allResults = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
        try {
            const response = await clientToUse.get(url, {
                params: {
                    ...params,
                    page: page,
                    per_page: config.api.perPage
                }
            });

            if (response.data && response.data.length > 0) {
                allResults = allResults.concat(response.data);

                // Check if we got a full page of results - if not, we're at the last page
                if (response.data.length < config.api.perPage) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        } catch (error) {
            handleApiError(`paginated ${url}`, error);
            break;
        }
    }

    return allResults;
}

/**
 * Fetches GitHub events for a user filtered by year
 * @async
 * @param {string} username - GitHub username
 * @param {number} year - Year to filter events by
 * @returns {Promise<Array>} Array of GitHub event objects for the specified year
 */
async function getGitHubUserActivity(username, year) {
    if (!githubClient) {
        console.log('GitHub client not configured, skipping GitHub data');
        return null;
    }

    try {
        console.log(`Fetching GitHub activity for user: ${username}, year: ${year}`);

        // Get user events from GitHub API
        const eventsUrl = `/users/${username}/events`;
        const events = await fetchAllPages(eventsUrl, {}, 50, githubClient); // GitHub has different pagination

        // Filter events for the specified year
        let filteredEvents = events.filter(event => {
            const eventDate = new Date(event.created_at);
            return eventDate.getFullYear() === year;
        });

        // Filter events by allowed repositories if specified in config
        if (config.github.allowedRepos && config.github.allowedRepos.length > 0) {
            filteredEvents = filteredEvents.filter(event => {
                if (event.repo && event.repo.name) {
                    return config.github.allowedRepos.includes(event.repo.name) ||
                           config.github.allowedRepos.includes(event.repo.name.split('/')[1]); // Just the repo name part
                }
                return true; // Keep events that don't have repo info
            });
            console.log(`Filtered events from ${events.length} to ${filteredEvents.length} based on allowed repositories`);
        }

        console.log(`Fetched ${filteredEvents.length} GitHub events for user ${username} in ${year}`);
        return filteredEvents;
    } catch (error) {
        handleApiError('GitHub user events', error);
        return [];
    }
}

// Function to get GitHub contributions using GraphQL API for more comprehensive data
async function getGitHubContributions(username, year) {
    if (!githubClient) {
        return null;
    }

    try {
        // GitHub's GraphQL API query to get contribution data
        const query = `
        query($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    weekday
                  }
                }
              }
              totalCommitContributions
              totalIssueContributions
              totalPullRequestContributions
              totalPullRequestReviewContributions
              totalRepositoryContributions
            }
          }
        }
        `;

        const variables = {
            username: username,
            from: `${year}-01-01T00:00:00Z`,
            to: `${year}-12-31T23:59:59Z`
        };

        const response = await githubClient.post('/graphql', {
            query: query,
            variables: variables
        });

        if (response.data && response.data.data && response.data.data.user) {
            const contribCollection = response.data.data.user.contributionsCollection;
            const calendar = contribCollection.contributionCalendar;

            // Process the contribution calendar data
            const contributions = {
                total: calendar.totalContributions || 0,
                totalCommits: contribCollection.totalCommitContributions || 0,
                totalIssues: contribCollection.totalIssueContributions || 0,
                totalPullRequests: contribCollection.totalPullRequestContributions || 0,
                totalReviews: contribCollection.totalPullRequestReviewContributions || 0,
                totalRepositories: contribCollection.totalRepositoryContributions || 0,
                byDate: {},
                byWeek: []
            };

            // Process weekly contribution data
            calendar.weeks.forEach(week => {
                week.contributionDays.forEach(day => {
                    contributions.byDate[day.date] = day.contributionCount;
                });
                contributions.byWeek.push(week);
            });

            console.log(`Fetched ${contributions.total} GitHub contributions for user ${username} in ${year} via GraphQL`);
            return contributions;
        } else {
            console.log(`GraphQL query returned no data for user ${username} in ${year}`);
            // Fallback to the previous method
            return await getGitHubContributionsFallback(username, year);
        }
    } catch (error) {
        console.log(`GraphQL query failed for user ${username} in ${year}, falling back to REST API:`, error.message);
        // Fallback to the previous method if GraphQL fails
        return await getGitHubContributionsFallback(username, year);
    }
}

// Fallback function to get GitHub contributions using REST API
async function getGitHubContributionsFallback(username, year) {
    if (!githubClient) {
        return null;
    }

    try {
        const contributions = {
            total: 0,
            byDate: {},
            byRepo: {},
            byType: {}
        };

        // Get events to calculate contributions
        const events = await getGitHubUserActivity(username, year);

        events.forEach(event => {
            const date = new Date(event.created_at);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Count by date
            contributions.byDate[dateStr] = (contributions.byDate[dateStr] || 0) + 1;

            // Count by repository
            if (event.repo && event.repo.name) {
                const repoName = event.repo.name;
                contributions.byRepo[repoName] = (contributions.byRepo[repoName] || 0) + 1;
            }

            // Count by event type
            const eventType = event.type;
            contributions.byType[eventType] = (contributions.byType[eventType] || 0) + 1;
        });

        // Calculate total contributions
        contributions.total = events.length;

        console.log(`Calculated ${contributions.total} GitHub contributions for user ${username} in ${year} via fallback method`);
        return contributions;
    } catch (error) {
        handleApiError('GitHub contributions fallback', error);
        return null;
    }
}

async function getGitHubUserDetails(username) {
    if (!githubClient) {
        return null;
    }

    try {
        const response = await githubClient.get(`/users/${username}`);
        return response.data;
    } catch (error) {
        handleApiError('GitHub user details', error);
        return null;
    }
}

async function getGitHubUserRepos(username) {
    if (!githubClient) {
        return [];
    }

    try {
        const params = {
            type: 'owner',
            sort: 'updated',
            direction: 'desc'
        };

        const allRepos = await fetchAllPages(`/users/${username}/repos`, params, 20, githubClient);

        // Filter repositories based on allowed repos if specified in config
        let repos = allRepos;
        if (config.github.allowedRepos && config.github.allowedRepos.length > 0) {
            repos = allRepos.filter(repo =>
                config.github.allowedRepos.includes(repo.name) ||
                config.github.allowedRepos.includes(repo.full_name)
            );
            console.log(`Filtered repositories from ${allRepos.length} to ${repos.length} based on allowed list`);
        } else {
            console.log(`Fetched ${repos.length} GitHub repositories for user ${username}`);
        }

        return repos;
    } catch (error) {
        handleApiError('GitHub user repositories', error);
        return [];
    }
}

async function getGitHubUserCommits(username, year) {
    if (!githubClient) {
        return [];
    }

    try {
        // Get user's repositories and fetch commits from each
        const repos = await getGitHubUserRepos(username);
        let allCommits = [];

        for (const repo of repos) {
            try {
                // Get commits for this repository
                const commitsUrl = `/repos/${username}/${repo.name}/commits`;
                const commits = await fetchAllPages(commitsUrl, {
                    author: username
                }, 20, githubClient);

                // Filter commits for the specified year
                const yearCommits = commits.filter(commit => {
                    const commitDate = new Date(commit.commit.author.date);
                    return commitDate.getFullYear() === year;
                });

                allCommits = allCommits.concat(yearCommits);
            } catch (error) {
                // Continue with other repos if one fails
                console.log(`Could not fetch commits for repo ${repo.name}:`, error.message);
            }
        }

        console.log(`Fetched ${allCommits.length} GitHub commits for user ${username} in ${year}`);
        return allCommits;
    } catch (error) {
        handleApiError('GitHub user commits', error);
        return [];
    }
}

// Function to analyze GitHub events and extract metrics
function analyzeGitHubEvents(events, commits) {
    if (!events) return null;

    const metrics = {
        totalEvents: events.length,
        totalCommits: commits.length,
        eventTypeCounts: {},
        repoActivity: {},
        monthlyActivity: {},
        topRepos: [],
        mostActiveMonth: '',
        contributions: {}
    };

    // Analyze events
    events.forEach(event => {
        // Count event types
        const eventType = event.type;
        metrics.eventTypeCounts[eventType] = (metrics.eventTypeCounts[eventType] || 0) + 1;

        // Count repository activity
        if (event.repo && event.repo.name) {
            const repoName = event.repo.name;
            metrics.repoActivity[repoName] = (metrics.repoActivity[repoName] || 0) + 1;

            // Track detailed repo contributions
            if (!metrics.contributions[repoName]) {
                metrics.contributions[repoName] = {
                    total: 0,
                    pushEvents: 0,
                    otherEvents: 0
                };
            }

            metrics.contributions[repoName].total++;

            if (eventType === 'PushEvent') {
                metrics.contributions[repoName].pushEvents++;
            } else {
                metrics.contributions[repoName].otherEvents++;
            }
        }

        // Count monthly activity
        if (event.created_at) {
            const eventDate = new Date(event.created_at);
            const month = eventDate.toLocaleString('default', { month: 'long' });
            metrics.monthlyActivity[month] = (metrics.monthlyActivity[month] || 0) + 1;
        }
    });

    // Get top repos by activity
    metrics.topRepos = Object.entries(metrics.repoActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([repo, count]) => ({ repo, count }));

    // Get most active month
    const mostActive = Object.entries(metrics.monthlyActivity)
        .sort(([,a], [,b]) => b - a)[0];
    metrics.mostActiveMonth = mostActive ? mostActive[0] : '';

    return metrics;
}

// Function to analyze GitHub time patterns
function analyzeGitHubTimePatterns(events) {
    if (!events) return null;

    const timeMetrics = {
        hourlyActivity: {}, // 0-23 hours
        dailyActivity: {}, // 0-6 days (Sunday-Saturday)
        weeklyActivity: {}, // Week number of the year
        monthlyActivity: {} // Month names
    };

    events.forEach(event => {
        if (event.created_at) {
            const date = new Date(event.created_at);

            // Hour of day (0-23)
            const hour = date.getHours();
            timeMetrics.hourlyActivity[hour] = (timeMetrics.hourlyActivity[hour] || 0) + 1;

            // Day of week (0-6, Sunday-Saturday)
            const dayOfWeek = date.getDay();
            timeMetrics.dailyActivity[dayOfWeek] = (timeMetrics.dailyActivity[dayOfWeek] || 0) + 1;

            // Week of year
            const weekNumber = getWeekNumber(date);
            timeMetrics.weeklyActivity[weekNumber] = (timeMetrics.weeklyActivity[weekNumber] || 0) + 1;

            // Month
            const month = date.toLocaleString('default', { month: 'long' });
            timeMetrics.monthlyActivity[month] = (timeMetrics.monthlyActivity[month] || 0) + 1;
        }
    });

    return timeMetrics;
}

// Function to analyze GitHub streaks
function analyzeGitHubStreaks(events) {
    if (!events) return null;

    // Group events by date
    const eventsByDate = {};

    events.forEach(event => {
        if (event.created_at) {
            const date = new Date(event.created_at);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            if (!eventsByDate[dateStr]) {
                eventsByDate[dateStr] = [];
            }
            eventsByDate[dateStr].push(event);
        }
    });

    // Get sorted list of active dates
    const activeDates = Object.keys(eventsByDate).sort();

    // Find the longest streak
    let currentStreak = 0;
    let maxStreak = 0;
    let currentStreakStart = null;
    let maxStreakStart = null;
    let maxStreakEnd = null;

    for (let i = 0; i < activeDates.length; i++) {
        if (i === 0) {
            currentStreak = 1;
            currentStreakStart = activeDates[i];
        } else {
            const prevDate = new Date(activeDates[i-1]);
            const currDate = new Date(activeDates[i]);

            // Calculate difference in days
            const diffTime = currDate - prevDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                currentStreak++;
            } else if (diffDays > 1) {
                // Streak broken
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                    maxStreakStart = currentStreakStart;
                    maxStreakEnd = activeDates[i-1];
                }
                currentStreak = 1;
                currentStreakStart = activeDates[i];
            }
        }
    }

    // Check the final streak
    if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        maxStreakStart = currentStreakStart;
        maxStreakEnd = activeDates[activeDates.length - 1];
    }

    return {
        maxStreak,
        maxStreakStart,
        maxStreakEnd,
        totalActiveDays: activeDates.length
    };
}

// Function to handle API errors
function handleApiError(entity, error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`API Error fetching ${entity}:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config.url
        });
    } else if (error.request) {
        // The request was made but no response was received
        console.error(`Network Error fetching ${entity}:`, error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`Error fetching ${entity}:`, error.message);
    }
}

// Function to determine appropriate filename based on data sources
function getOutputFilename(summary) {
    let platform = 'gitlab'; // default

    // Determine platform based on what data is available in the summary
    const hasGitLab = summary.gitlab && summary.gitlab.events && summary.gitlab.events.totalEvents > 0;
    const hasGitHub = summary.github && summary.github.events && summary.github.events.totalEvents > 0;

    if (hasGitLab && hasGitHub) {
        platform = 'all-platforms';
    } else if (hasGitHub) {
        platform = 'github';
    } else if (hasGitLab) {
        platform = 'gitlab';
    }

    // Use custom filename if provided, otherwise generate based on platform
    const customFilename = process.env.OUTPUT_FILENAME;
    if (customFilename) {
        return customFilename;
    }

    return `${platform}-year-in-review-${config.year}.md`;
}

// Function to save the report to a file
async function saveReportToFile(report, summary) {
    try {
        const filename = getOutputFilename(summary);
        await fs.writeFile(filename, report);
        console.log(`Report saved to ${filename}`);
    } catch (error) {
        console.error('Error saving report to file:', error);
        throw error;
    }
}

// Function to generate a simple text-based visualization
function generateActivityVisualization(summary) {
    let visualization = `## Activity Visualization\n\n`;

    // GitLab monthly activity chart
    if (summary.gitlab && summary.gitlab.events) {
        visualization += `### GitLab Monthly Activity Chart\n\n`;
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Find max activity count for scaling
        const maxActivity = Math.max(...Object.values(summary.gitlab.events.monthlyActivity), 1);

        months.forEach(month => {
            const count = summary.gitlab.events.monthlyActivity[month] || 0;
            const barLength = Math.round((count / maxActivity) * 20); // Scale to 20 characters max
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            visualization += `${month.padEnd(10)} |${bar}| ${count}\n`;
        });

        visualization += `\n`;
    }

    // GitHub monthly activity chart if available
    if (summary.github && summary.github.events) {
        visualization += `### GitHub Monthly Activity Chart\n\n`;
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Find max activity count for scaling
        const maxActivity = Math.max(...Object.values(summary.github.events.monthlyActivity), 1);

        months.forEach(month => {
            const count = summary.github.events.monthlyActivity[month] || 0;
            const barLength = Math.round((count / maxActivity) * 20); // Scale to 20 characters max
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            visualization += `${month.padEnd(10)} |${bar}| ${count}\n`;
        });

        visualization += `\n`;
    }

    return visualization;
}

// Main function to run the year-in-review for single user or team
async function runYearInReview() {
    try {
        if (config.gitlab.teamUsers.length > 0) {
            console.log(`Generating Team Year-in-Review for ${config.year}...`);
            console.log(`Team members: ${config.gitlab.teamUsers.join(', ')}`);
            return await runTeamYearInReview();
        } else {
            console.log(`Generating GitLab Year-in-Review for ${config.year}...`);
            return await runSingleUserYearInReview();
        }
    } catch (error) {
        console.error('Error running year-in-review:', error);
        throw error;
    }
}

// Function to run year-in-review for a single user
async function runSingleUserYearInReview() {
    // First, get user details to find the numeric user ID
    const userDetails = await getUserDetails();
    if (!userDetails) {
        throw new Error(`User with username ${config.gitlab.userId} not found`);
    }

    const userId = userDetails.id;
    console.log(`Found user ID: ${userId}`);

    // Get user activity summary
    const summary = await getUserActivitySummary(userId, config.year);

    // Generate the main report
    let report = generateYearInReviewReport(summary);

    // Add visualization to the report
    report += generateActivityVisualization(summary);

    // Save the report to a file
    await saveReportToFile(report, summary);

    // Also print a summary to console
    console.log('\n--- Year-in-Review Summary ---');
    console.log(`User: ${summary.user ? summary.user.name : 'Unknown'}`);
    console.log(`Year: ${summary.year}`);
    console.log(`Total Activities: ${summary.overall.totalActivities}`);
    console.log(`Total Projects: ${summary.overall.totalProjects}`);

    if (summary.gitlab) {
        console.log(`GitLab Activities: ${summary.gitlab.overall.totalActivities}`);
        console.log(`GitLab Projects: ${summary.gitlab.overall.totalProjects}`);
        console.log(`GitLab Merge Requests Created: ${summary.gitlab.overall.totalCreatedMRs}`);
        console.log(`GitLab Issues Created: ${summary.gitlab.overall.totalCreatedIssues}`);
        console.log(`GitLab Code Reviews: ${summary.gitlab.codeReviews.totalReviewed}`);
        console.log(`GitLab Most Active Month: ${summary.gitlab.events.mostActiveMonth}`);
        console.log(`GitLab Longest Activity Streak: ${summary.gitlab.streaks.maxStreak} days`);
        if (summary.gitlab.events.topProjects.length > 0) {
            console.log(`GitLab Top Project: ${summary.gitlab.events.topProjects[0].project}`);
        }
    }

    if (summary.github) {
        console.log(`GitHub Events: ${summary.github.events?.totalEvents || 0}`);
        console.log(`GitHub Commits: ${summary.github.commits || 0}`);
        if (summary.github.events) {
            console.log(`GitHub Most Active Month: ${summary.github.events.mostActiveMonth}`);
            console.log(`GitHub Longest Activity Streak: ${summary.github.streaks.maxStreak} days`);
            if (summary.github.events.topRepos.length > 0) {
                console.log(`GitHub Top Repository: ${summary.github.events.topRepos[0].repo}`);
            }
        }
    } else {
        console.log('GitHub: Not configured');
    }

    const finalFilename = getOutputFilename(summary);
    console.log(`Report saved to ${finalFilename}`);
    console.log('--- End Summary ---\n');

    return report;
}

// Function to run year-in-review for a team of users
async function runTeamYearInReview() {
    const teamSummaries = [];

    // Process each team member
    for (const username of config.gitlab.teamUsers) {
        console.log(`\nProcessing user: ${username}`);

        try {
            // Get user details by username
            const userDetails = await getUserDetailsByUsername(username);
            if (!userDetails) {
                console.error(`User with username ${username} not found, skipping...`);
                continue;
            }

            const userId = userDetails.id;
            console.log(`Found user ID: ${userId} for ${username}`);

            // Get user activity summary
            const summary = await getUserActivitySummary(userId, config.year);
            summary.username = username; // Add username to the summary
            teamSummaries.push(summary);
        } catch (error) {
            console.error(`Error processing user ${username}:`, error.message);
        }
    }

    // Generate team report
    const teamReport = generateTeamYearInReviewReport(teamSummaries);

    // Save the team report to a file
    const teamFilename = `team-year-in-review-${config.year}.md`;
    await fs.writeFile(teamFilename, teamReport);
    console.log(`Team report saved to ${teamFilename}`);

    // Print team summary
    console.log('\n--- Team Year-in-Review Summary ---');
    console.log(`Year: ${config.year}`);
    console.log(`Team Members: ${teamSummaries.length}`);
    console.log(`Total Activities: ${teamSummaries.reduce((sum, s) => sum + (s.overall?.totalActivities || 0), 0)}`);
    console.log(`Total Projects: ${new Set(teamSummaries.flatMap(s => s.gitlab?.projects?.names || [])).size}`);
    console.log('--- End Team Summary ---\n');

    return teamReport;
}

// Function to get user details by username
async function getUserDetailsByUsername(username) {
    try {
        const res = await gitlabClient.get(`/users?username=${username}`);
        if (res.data && res.data.length > 0) {
            return res.data[0]; // Get the first user that matches the username
        }
        return null;
    } catch (error) {
        handleApiError('user details', error);
        return null;
    }
}

// Function to generate team year-in-review report
function generateTeamYearInReviewReport(teamSummaries) {
    let report = `# Team Year-in-Review Report - ${config.year}\n\n`;

    report += `## Team Summary\n\n`;
    report += `- Total Team Members: ${teamSummaries.length}\n`;
    report += `- Total Activities: ${teamSummaries.reduce((sum, s) => sum + (s.overall?.totalActivities || 0), 0)}\n`;
    report += `- Total Projects: ${new Set(teamSummaries.flatMap(s => s.gitlab?.projects?.names || [])).size}\n\n`;

    // Add individual user reports
    for (const summary of teamSummaries) {
        report += `## User: ${summary.user?.name || summary.username} (@${summary.username})\n\n`;

        if (summary.gitlab) {
            report += `### GitLab Activity\n\n`;
            report += `- Total Activities: ${summary.gitlab.overall.totalActivities}\n`;
            report += `- Projects Involved: ${summary.gitlab.overall.totalProjects}\n`;
            report += `- Merge Requests Created: ${summary.gitlab.overall.totalCreatedMRs}\n`;
            report += `- Issues Created: ${summary.gitlab.overall.totalCreatedIssues}\n`;
            report += `- Code Reviews: ${summary.gitlab.codeReviews.totalReviewed}\n\n`;

            // Top projects
            if (summary.gitlab.events?.topProjects?.length > 0) {
                report += `### Top Projects\n\n`;
                summary.gitlab.events.topProjects.slice(0, 5).forEach((project, index) => {
                    report += `${index + 1}. ${project.project}: ${project.count} activities\n`;
                });
                report += `\n`;
            }

            // Most active month
            if (summary.gitlab.events?.mostActiveMonth) {
                report += `- Most Active Month: ${summary.gitlab.events.mostActiveMonth}\n`;
            }

            // Streak
            if (summary.gitlab.streaks?.maxStreak) {
                report += `- Longest Activity Streak: ${summary.gitlab.streaks.maxStreak} days\n`;
            }
            report += `\n`;
        }

        if (summary.github) {
            report += `### GitHub Activity\n\n`;
            report += `- Total Events: ${summary.github.events?.totalEvents || 0}\n`;
            report += `- Total Commits: ${summary.github.commits || 0}\n`;
            report += `- Total Contributions: ${summary.github.contributions?.total || 0}\n\n`;

            if (summary.github.events?.mostActiveMonth) {
                report += `- Most Active Month: ${summary.github.events.mostActiveMonth}\n`;
            }

            if (summary.github.streaks?.maxStreak) {
                report += `- Longest Activity Streak: ${summary.github.streaks.maxStreak} days\n`;
            }
            report += `\n`;
        }
    }

    // Team-wide statistics
    report += `## Team-wide Statistics\n\n`;

    // Most active users
    const sortedUsers = [...teamSummaries].sort((a, b) =>
        (b.gitlab?.overall?.totalActivities || 0) - (a.gitlab?.overall?.totalActivities || 0)
    );

    report += `### Most Active Users (by GitLab activities)\n\n`;
    sortedUsers.slice(0, 5).forEach((summary, index) => {
        report += `${index + 1}. ${summary.user?.name || summary.username}: ${summary.gitlab?.overall?.totalActivities || 0} activities\n`;
    });

    // Top projects across team
    const projectCounts = {};
    teamSummaries.forEach(summary => {
        if (summary.gitlab?.events?.projectContributions) {
            Object.entries(summary.gitlab.events.projectContributions).forEach(([project, contrib]) => {
                if (!projectCounts[project]) {
                    projectCounts[project] = 0;
                }
                projectCounts[project] += contrib.total;
            });
        }
    });

    const sortedProjects = Object.entries(projectCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    report += `\n### Top Projects Across Team\n\n`;
    sortedProjects.forEach(([project, count], index) => {
        report += `${index + 1}. ${project}: ${count} total activities\n`;
    });

    return report;
}

// Run the year-in-review if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    // Check if required config is available before running
    try {
        config.validate();
        runYearInReview().catch(error => {
            console.error('Failed to generate year-in-review:', error);
            process.exit(1);
        });
    } catch (configError) {
        console.error('Configuration error:', configError.message);
        console.log('\nPlease set up your .env file with the required configuration.');
        console.log('Copy .env.example to .env and update with your GitLab credentials.');
        process.exit(1);
    }
}

// Export functions for use in other modules if needed
export {
    getUserActivitySummary,
    generateYearInReviewReport,
    saveReportToFile,
    runYearInReview,
    analyzeMergeRequests,
    analyzeIssues,
    analyzeTimePatterns,
    getWeekNumber,
    analyzeStreaks,
    analyzeGitHubEvents,
    analyzeGitHubTimePatterns,
    analyzeGitHubStreaks,
    getOutputFilename
};
