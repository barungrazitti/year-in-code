import config from './config.js';
import { getUserActivitySummary } from './index.js';

console.log('Starting focused test...');

try {
    console.log(`Fetching GitLab activity for user: ${config.gitlab.userId}, year: ${config.year}`);
    console.log('This may take a moment...');
    
    // Try to run the function
    const summary = await getUserActivitySummary();
    console.log('Summary generated successfully!');
    console.log('Total activities:', summary.overall.totalActivities);
} catch (error) {
    console.error('Error in focused test:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
    }
}