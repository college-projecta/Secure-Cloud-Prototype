# Secure Cloud Prototype

Secure Cloud Storage Prototype with File Encryption, Block Segmentation and CDN-based Web Hosting.

## Goal

This college project demonstrates AES-256-GCM encryption, encrypted block segmentation, cloud-ready storage, block reconstruction and local decryption, plus a static documentation site designed for AWS S3 + CloudFront.

This is an educational prototype, not a production cloud-storage service. It does not implement authentication, authorization, persistent key management, secure key recovery, audit logging, malware scanning or production access controls.

## Features

- AES-256-GCM using the browser Web Crypto API.
- Fresh random 256-bit AES key for each demo encryption.
- Random 96-bit GCM IV.
- Configurable encrypted block size from 64 bytes to 10 MB.
- Visual block list and size metrics.
- Reconstruction followed by authenticated decryption.
- Original file download after successful decryption.
- No file upload from the demo page; processing happens locally.
- Responsive documentation site.
- AWS S3 + CloudFront deployment guide.
- GitHub Pages workflow.

## Architecture

    User -> Select File -> AES-256-GCM -> Encrypted Data
      -> Split into Blocks -> Cloud Storage (S3 / Azure / GCS)
      -> Download Blocks -> Reconstruct -> AES-GCM Decrypt -> Original File

Website delivery:

    Global User -> HTTPS -> CloudFront CDN -> S3 -> Static Website

## Encryption flow

1. Read the selected file as an ArrayBuffer.
2. Generate an AES-256 key with crypto.subtle.generateKey.
3. Generate a cryptographically secure random 12-byte IV.
4. Encrypt with AES-GCM. The result contains authenticated ciphertext.
5. Split ciphertext into blocks.
6. Conceptually store blocks as separate cloud objects.
7. Concatenate downloaded blocks in their original order.
8. AES-GCM verifies and decrypts the reconstructed ciphertext.
9. Download the original file.

## Why split after encryption?

The cloud-facing blocks contain ciphertext rather than plaintext. Segmentation is a storage/transfer technique, not a replacement for encryption.

## Key limitation

The prototype keeps the AES key only in browser memory. Refreshing the page loses the key. A production system needs key management, authentication, authorization, recovery, rotation and policy controls.

## Assignment requirement mapping

| Requirement | Implementation |
|---|---|
| Divide a file into segments/blocks | Configurable encrypted block segmentation |
| Download file from cloud in encrypted form | Architecture uses encrypted blocks |
| Portfolio/documentation site | Responsive static site |
| S3 / Azure / GCS | AWS S3 documented; storage can be adapted |
| CDN such as CloudFront | AWS CloudFront architecture and guide |
| HTTPS | CloudFront HTTPS delivery |

## Project structure

    Secure-Cloud-Prototype/
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── README.md
    ├── docs/
    │   └── AWS-CLOUDFRONT.md
    └── .github/
        └── workflows/
            └── pages.yml

## Run locally

No build system or npm dependency is required.

    python -m http.server 8080

Open http://localhost:8080 in a modern browser.

## AWS deployment

See docs/AWS-CLOUDFRONT.md.

Never put AWS access keys, secret keys, passwords or long-lived credentials in this public repository.

## Viva — 30-second explanation

“My project is a Secure Cloud Storage Prototype. When a user selects a file, the application encrypts it using AES-256-GCM in the browser and divides the encrypted data into multiple blocks. These encrypted blocks can be stored as cloud objects such as Amazon S3 objects. During download, the blocks are reconstructed and AES-GCM authenticates and decrypts the data to recover the original file. I also designed a documentation website and an AWS S3 with CloudFront architecture to demonstrate CDN-based delivery and HTTPS.”

## Security note

AES-GCM provides authenticated encryption, but the overall system is only as secure as its key management and surrounding controls. This project focuses on the core encryption/segmentation concept and documents production features that would still be required.
