import config from './config.js';

console.log('Testing configuration...');

try {
    console.log('Config gitlab token:', config.gitlab.token ? 'SET' : 'NOT SET');
    console.log('Config gitlab userId:', config.gitlab.userId ? 'SET' : 'NOT SET');
    console.log('Config year:', config.year);
    
    config.validate();
    console.log('Configuration is valid!');
} catch (error) {
    console.error('Configuration validation failed:', error.message);
}