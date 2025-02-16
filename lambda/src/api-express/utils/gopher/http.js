const querystring = require('querystring');

const gopherGenerator = {
    host: '127.0.0.1',
    port: "80",
    method: 'GET',
    path: '/',
    type: 'x-www-form-urlencoded',
    body: '',
    headers: {},

    generatePayload: function() {
        let payload = `${this.method} ${this.path} HTTP/1.1\r\n` +
                      `Host: 127.0.0.1\r\n` +
                      `Content-Type: application/${this.type}\r\n`;

        for (const [key, value] of Object.entries(this.headers)) {
            payload += `${key}: ${value}\r\n`;
        }

        if (this.method === 'POST' && this.body) {
            let encodedBody = "";
            if (typeof this.body === 'object') {
                encodedBody = JSON.stringify(this.body);
            } else {
                encodedBody = querystring.escape(this.body);
            }
            payload += `Content-Length: ${Buffer.byteLength(encodedBody)}\r\n\r\n` +
                       `${encodedBody}`;
        } else {
            payload += '\r\n';
        }

        payload = querystring.escape(payload + " ");

        return `gopher://${this.host}:${this.port}/_${payload}`;
    },
}
module.exports = gopherGenerator;

