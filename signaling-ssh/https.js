"use strict";

const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-crt.pem')
};

const server = https.createServer(options,
    (request, response) => {
        fs.readFile('./index.html', 'UTF-8',
        (error, data) => {
            response.writeHead(200, {'Content-Type':'text/html'});
            response.write(data);
            response.end();
        });
    }
);
server.listen(3001);
console.log('server running...');
