# My Amazon Web Services (AWS) Management

Work with [CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html), [Ansible](https://docs.ansible.com/) and [AWS CLI](https://docs.aws.amazon.com/cli/index.html)

## Features

* My personal static file storge by S3 bucket and distributed by Cloudfront with **image resizing** on the fly
![](https://img.codiy.net/repo/aws-playbook/2021-12/29103151.png)

## Cloudfront Distribution

Distribution `img.codiy.net` for optimized images only, obtain images from S3 bucket by prefix `_optimized`.
Distribution `s3.codiy.net` for whole bucket objects.

* **Origin**: Use AWS S3 as origin and for distribution `img.codiy.net` origin path is `_optimized`.
* **Behavior**: enable compress, redirect to https, allow methods, cached methods and lamda@edge functions etc.
* **CachePolicy**: setting cache ttl and cached query string.
* **OriginRequestPolicy**: allowed CORS requests and forward query string to S3 origin.
* **ResponseHeadersPolicy**: allows all origins for CORS requests, including preflight requests, and adds security headers.

## AWS S3 Bucket

### `s3.codiy.net` Bucket

* Store my images, videos, documents etc.
* Object with prefix `_optimized` are images optimized by [tinypng](https://tinypng.com/).
* Object with prefix `_optimized/_thumbnail` are images handled by lambda@edge.
* With `BucketPolicy` only `GetObject` by Cloudfront or lambda@edge
* Allow CORS requests.
* With lifecycle configuration.

### `kfc.internal.virginia` Bucket

* Private Bucket, storage for programming purpose
* Upload lambda source code zip file to deploy lambda function
* By lifecycle configuration will automatically expiration and delete lambda source code zip files.

## Pricing

|S3 Intelligent - Tiering* 	|Automatic cost savings for data with unknown or changing access patterns|
|-|-|
|Data Transfer OUT From Amazon S3 To Internet (First 10 TB) / Month	|$0.09 per GB|
|Monitoring and Automation, All Storage / Month (Objects > 128 KB)	|$0.0025 per 1,000 objects|
|Frequent Access Tier, First 50 TB / Month	|$0.023 per GB|
|Frequent Access Tier, Next 450 TB / Month	|$0.022 per GB|
|Frequent Access Tier, Over 500 TB / Month	|$0.021 per GB|
|Infrequent Access Tier, All Storage / Month	|$0.0125 per GB|
|Archive Instant Access Tier, All Storage / Month	|$0.004 per GB|

100,000 Objects == $0.25
100G * 0.004 == $0.4

Download 100G == 100 * 0.09 == $9



## References

* [HoraceShmorace/Image-Flex](https://github.com/HoraceShmorace/Image-Flex)
* [https://aws.amazon.com/s3/pricing/](https://aws.amazon.com/s3/pricing/)
* [https://aws.amazon.com/cloudfront/pricing/]( https://aws.amazon.com/cloudfront/pricing/)
