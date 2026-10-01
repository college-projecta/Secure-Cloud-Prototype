# AWS S3 + CloudFront Deployment Guide

## 1. Test locally

    python -m http.server 8080

Open http://localhost:8080.

## 2. Create an S3 bucket

1. Open Amazon S3.
2. Create a bucket with a globally unique name.
3. Choose a suitable region.
4. Keep public access blocked when using CloudFront Origin Access Control (recommended).
5. Upload index.html, styles.css, app.js and the docs directory.

For a production-style setup, CloudFront should access a private S3 origin using Origin Access Control rather than making the bucket publicly readable.

## 3. Create a CloudFront distribution

1. Create a distribution.
2. Select the S3 bucket as the origin.
3. Configure Origin Access Control and allow the distribution to read the bucket.
4. Set the default root object to index.html.
5. Redirect HTTP to HTTPS.
6. Select a suitable cache policy.
7. Deploy the distribution.

CloudFront then provides a CDN endpoint serving the static website through HTTPS.

## 4. Bucket policy

When using Origin Access Control, use the policy generated or recommended by the AWS console for the specific distribution. Do not use a broad public-read policy for a production bucket.

## 5. Optional custom domain

1. Request an ACM certificate in the region required by CloudFront. CloudFront certificates are provisioned in us-east-1.
2. Validate the domain.
3. Attach the certificate to the distribution.
4. Add the domain as an alternate domain name.
5. Configure DNS to point the domain to CloudFront.

## 6. Verify

Check that the website, CSS and JavaScript load; the browser demo works; the CloudFront URL uses HTTPS; and static content is served through CloudFront.

## Important security distinction

Website hosting and encrypted file storage are related but separate concerns.

The demo encrypts a selected file locally and demonstrates block segmentation. It does not automatically upload blocks to S3.

A production extension could add an authenticated API that uploads ciphertext blocks to private S3 objects. Such a system would need authentication, authorization, short-lived upload/download authorization, robust key management, object metadata/version handling, access logging, monitoring, rate limits and recovery procedures.

Never place AWS credentials in this repository or browser JavaScript.

## Architecture

    WEBSITE DELIVERY

    User -> CloudFront CDN -> HTTPS -> Private S3 bucket
                                  |
                                  +-- index.html
                                  +-- styles.css
                                  +-- app.js
                                  '-- docs/

    FILE PROTECTION CONCEPT

    User file -> Browser AES-256-GCM -> Encrypted ciphertext
      -> Split into blocks -> Private cloud storage

## Azure / Google Cloud adaptation

The client-side encryption and block segmentation are provider-neutral. The storage layer can be adapted to Azure Blob Storage or Google Cloud Storage. The core principle remains: encrypt before storage and keep secret keys out of public/static client assets.
