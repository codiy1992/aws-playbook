"use strict";

/**
 *
 *
{
    "version": "2.0",
    "routeKey": "$default",
    "rawPath": "/path",
    "rawQueryString": "",
    "headers": {
        "content-length": "2",
        "x-amzn-tls-cipher-suite": "ECDHE-RSA-AES128-GCM-SHA256",
        "x-amzn-tls-version": "TLSv1.2",
        "x-amzn-trace-id": "Root=1-65a78658-33f6197444b4634b69ec8950",
        "x-forwarded-proto": "https",
        "host": "cx2e7tpxf6v2rggaphirhwxore0sbuwy.lambda-url.ap-southeast-1.on.aws",
        "x-forwarded-port": "443",
        "content-type": "application/json",
        "x-forwarded-for": "xxxx",
        "accept-encoding": "gzip",
        "user-agent": "xxx"
    },
    "requestContext": {
        "accountId": "anonymous",
        "apiId": "cx2e7tpxf6v2rggaphirhwxore0sbuwy",
        "domainName": "cx2e7tpxf6v2rggaphirhwxore0sbuwy.lambda-url.ap-southeast-1.on.aws",
        "domainPrefix": "cx2e7tpxf6v2rggaphirhwxore0sbuwy",
        "http": {
            "method": "GET",
            "path": "/path",
            "protocol": "HTTP/1.1",
            "sourceIp": "xxx",
            "userAgent": "xxxx"
        },
        "requestId": "99466596-8527-4733-bbcc-7c8746e7870f",
        "routeKey": "$default",
        "stage": "$default",
        "time": "17/Jan/2024:07:48:40 +0000",
        "timeEpoch": 1705477720121
    },
    "body": "{\n    \"aaa\": \"bbb\"\n}",
    "isBase64Encoded": false
}
*/
const https = require("https");
const { parse } = require("querystring");

exports.handler = async function (event, context) {
    let { s: service } = parse(event.rawQueryString);
    let headers = event.headers;
    headers["Authorization"] = "Basic Y3Jhenk6ek5nU2dZV2N1Vjk0UmlBYw==";
    delete headers["content-length"];
    delete headers["host"];
    const options = {
        hostname: service + ".codiy.net",
        path: event.rawPath + "?" + event.rawQueryString,
        method: "POST",
        port: 443,
        headers: headers,
    };
    return new Promise(function (resolve, reject) {
        const req = https.request(options, (res) => {
            let response = "";

            res.on("data", (chunk) => {
                response += chunk;
            });

            res.on("end", () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: response,
                });
            });
        });

        req.on("error", (e) => {
            reject(Error(e));
        });

        if (event.body) {
            req.write(event.body);
        }

        req.end();
    });
};
