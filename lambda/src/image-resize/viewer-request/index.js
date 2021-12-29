"use strict";

const { parse } = require("querystring");

// @link https://docs.aws.amazon.com/zh_cn/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html
exports.handler = (event, context, callback) => {
    // console.log(JSON.stringify(event));
    const {
        request,
        request: { headers, querystring, uri },
    } = event.Records[0].cf;

    let width = 0;
    let height = 0;

    const match = uri.match(/\/(\d+)x(\d+)\//);
    const params = parse(request.querystring);
    if (!match && !params.d && !params.w) {
        callback(null, request);
        return;
    }

    if (params.d) {
        const split = params.d.split("x");
        width = split[0];
        height = split[1];
    } else {
        width = params.w || 0;
        height = params.h || 0;
    }

    if (match) {
        width = match[1];
        height = match[2];
    }

    if (isNaN(parseInt(width, 10))) {
        callback(null, request);
        return;
    }

    if (isNaN(parseInt(height, 10))) {
        height = 0;
    }

    const [, prefix, imageName, extension] = uri.match(/(.*)\/(.*)\.(\w+)/);
    const accept = Array.isArray(headers.accept) ? headers.accept[0].value : "";
    const ext =
        accept.indexOf("webp") !== -1
            ? "webp"
            : extension.toLowerCase() === "jpg"
            ? "jpeg"
            : extension.toLowerCase();
    const dimensions = height ? `${width}x${height}` : width;

    request.uri = `/_thumbnail${prefix
        .replace(/\/\d+x\d+\/?/, "/")
        .replace(/\/$/, "")}/${dimensions}/${imageName}.${ext}`;

    request.querystring = [
        `w=${width}`,
        `h=${height}`,
        `e=${ext}`,
        `s=${uri.replace(/\/\d+x\d+\//, "/")}`,
    ].join("&");

    // console.log(request.uri);
    // console.log(request.querystring);
    callback(null, request);
};
