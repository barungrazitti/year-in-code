import axios from "axios";
import config from './config.js';

const client = axios.create({
    baseURL: config.gitlab.baseUrl,
    headers: { "PRIVATE-TOKEN": config.gitlab.token },
    timeout: config.api.timeout
});

async function testConnection() {
    try {
        console.log(`Testing connection to ${config.gitlab.baseUrl} for user ${config.gitlab.userId}...`);
        
        // Test with a simple API call
        const res = await client.get(`/users?username=${config.gitlab.userId}`);
        console.log('API call successful!');
        console.log('Response status:', res.status);
        console.log('Number of users found:', res.data.length);
        
        if (res.data.length > 0) {
            console.log('First user:', res.data[0].name || res.data[0].username);
        }
    } catch (error) {
        console.error('API call failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testConnection();