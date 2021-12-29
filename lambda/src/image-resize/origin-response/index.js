"use strict";

const AWS = require("aws-xray-sdk").captureAWS(require("aws-sdk"));
const Sharp = require("sharp");
const { parse } = require("querystring");

const S3 = new AWS.S3();

// @link https://docs.aws.amazon.com/zh_cn/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-response-origin
exports.handler = (event, context, callback) => {
    // console.log(JSON.stringify(event));
    const {
        cf: {
            request: {
                origin: {
                    s3: { domainName, path },
                },
                querystring,
                uri,
            },
            response,
            response: { status },
        },
    } = event.Records[0];

    if (!["403", "404"].includes(status) || querystring == "") {
        callback(null, response);
        return;
    }

    let { w: width, h: height, e: ext, s: sourceImage } = parse(querystring);
    const [bucket] = domainName.match(
        /.+(?=\.s3\.\w+-\w+-\d\.amazonaws\.com)/i
    );
    const contentType = "image/" + ext;

    // Notice:
    // key must use `path` as Prefix
    // cause cloudfront will always automatically add `path` as prefix
    // when retrieving object from bucket
    const key = path + uri;
    const sourceKey = path + sourceImage;

    // console.log(JSON.stringify([bucket, key, sourceKey]));

    height = parseInt(height, 10) || null;
    width = parseInt(width, 10);
    if (isNaN(width) || width < 15) {
        callback(null, response);
        return;
    }

    return S3.getObject({ Bucket: bucket, Key: sourceKey.replace(/^\//, "") })
        .promise()
        .then((imageObj) => {
            let resizedImage;
            const errorMessage = `Error while resizing "${sourceKey}" to "${key}":`;
            // Required try/catch because Sharp.catch() doesn't seem to actually catch anything.
            // @link https://sharp.pixelplumbing.com/api-resize#resize
            try {
                resizedImage = Sharp(imageObj.Body)
                    .resize(width, height, {
                        fit: "outside",
                    })
                    .toFormat(ext, {
                        quality: 95,
                    })
                    .toBuffer()
                    .catch((error) => {
                        throw new Error(`${errorMessage} ${error}`);
                    });
            } catch (error) {
                throw new Error(`${errorMessage} ${error}`);
            }
            return resizedImage;
        })
        .then(async (imageBuffer) => {
            await S3.putObject({
                Body: imageBuffer,
                Bucket: bucket,
                ContentType: contentType,
                Key: key.replace(/^\//, ""),
                StorageClass: "STANDARD",
            })
                .promise()
                .catch((error) => {
                    throw new Error(
                        `Error while putting resized image '${uri}' into bucket: ${error}`
                    );
                });

            return {
                ...response,
                status: 200,
                statusDescription: "Found",
                body: imageBuffer.toString("base64"),
                bodyEncoding: "base64",
                headers: {
                    ...response.headers,
                    "content-type": [
                        { key: "Content-Type", value: contentType },
                    ],
                },
            };
        })
        .catch((error) => {
            console.log(
                `Error while getting source image object "${sourceKey}": ${error}`
            );
            callback(null, response);
        });
};
