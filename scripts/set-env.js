const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:8080';
const wsUrl = process.env.WS_URL || apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');

const content = `export const environment = {
    production: true,
    apiUrl: '${apiUrl}',
    wsUrl: '${wsUrl}'
};
`;

const envPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(envPath, content);
console.log(`environment.ts generado con apiUrl: ${apiUrl}`);
