import axios from "axios";
import config from "./config.js";

const client = axios.create({
    baseURL: config.gitlab.baseUrl,
    headers: { "PRIVATE-TOKEN": config.gitlab.token },
    timeout: config.api.timeout
});

async function testIndividualCalls() {
    console.log('Testing individual API calls...');
    
    try {
        // Test 1: Get user details
        console.log('\n1. Testing user details...');
        const userRes = await client.get(`/users?username=${config.gitlab.userId}`);
        console.log('✓ User details call successful');
        
        // Test 2: Get events
        console.log('\n2. Testing events...');
        const eventsRes = await client.get(`/users/${config.gitlab.userId}/events`, {
            params: {
                after: `${config.year}-01-01`,
                before: `${config.year}-12-31`,
                per_page: 10  // Small number to test
            }
        });
        console.log(`✓ Events call successful, got ${eventsRes.data.length} events`);
        
        // Test 3: Get projects
        console.log('\n3. Testing projects...');
        const projectsRes = await client.get(`/users/${config.gitlab.userId}/projects`, {
            params: {
                membership: true,
                per_page: 10
            }
        });
        console.log(`✓ Projects call successful, got ${projectsRes.data.length} projects`);
        
        console.log('\nAll API calls working correctly!');
        
    } catch (error) {
        console.error('\nError in API test:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data?.message || error.response.data);
        }
    }
}

testIndividualCalls();