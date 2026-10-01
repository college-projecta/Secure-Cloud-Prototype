# Secure Cloud — Encrypted Storage Laboratory

**Secure Cloud Storage Prototype with File Encryption, Block Segmentation and CDN-based Web Hosting**

A professional, browser-first prototype demonstrating how a secure cloud-storage pipeline can encrypt data before cloud transfer, segment ciphertext into blocks, verify integrity, reconstruct the payload and deliver a static application globally through a CDN.

> **Important:** this is an educational/security-engineering prototype, not a production Dropbox/Drive replacement. The demo intentionally does not upload user files and does not export the session encryption key.

## Product capabilities

### Secure workspace
- Drag-and-drop or file-picker input.
- Browser-side AES-256-GCM encryption using the Web Crypto API.
- Fresh cryptographically secure 96-bit IV for every encryption operation.
- Configurable 64 KB–10 MB encrypted block size.
- Per-block SHA-256 fingerprints and ordered block map.
- Full ciphertext SHA-256 verification before decryption.
- AES-GCM authentication on reconstructed ciphertext.
- One-click download of the original file after successful verification.
- Optional tamper simulation to demonstrate integrity failure.
- Export of a cloud-ready JSON manifest containing encrypted blocks and metadata **without exporting the secret key**.

### Global delivery architecture
- Responsive professional UI for desktop and mobile.
- GitHub Pages deployment workflow.
- AWS S3 + CloudFront architecture documentation.
- HTTPS/CDN delivery model.
- Storage model adaptable to Amazon S3, Azure Blob Storage or Google Cloud Storage.

## Security model

The important design decision is:

**Plaintext → Encrypt → Ciphertext → Segment → Store/Transfer**

not:

**Plaintext → Segment → Store → Encrypt**

The cloud-facing data model therefore contains ciphertext blocks. AES-GCM also provides authenticated encryption, so a modified ciphertext should fail authentication during decryption.

### What is protected in the demo?

| Control | Prototype behavior |
|---|---|
| Confidentiality | AES-256-GCM |
| Integrity | AES-GCM authentication + SHA-256 block/ciphertext checks |
| IV generation | Web Crypto secure random 96-bit IV |
| Key exposure | Key stays in browser memory |
| File upload | No upload to this GitHub Pages application |
| Block ordering | Explicit 1-based block indexes |
| Tamper testing | Built-in modified-block demonstration |
| Transport | HTTPS when hosted through GitHub Pages/CloudFront |

### What is deliberately not implemented?

A production service still needs:
- User identity and MFA.
- Authorization and tenant isolation.
- Secure key management / KMS or HSM integration.
- Key recovery, rotation and revocation.
- Short-lived signed upload/download URLs.
- Private S3 buckets and strict IAM policies.
- Malware/content scanning where required.
- Rate limiting and abuse protection.
- Audit logs and security monitoring.
- Backups, disaster recovery and lifecycle policies.
- Metadata privacy and retention controls.
- Security testing, dependency management and incident response.
- Regulatory/compliance analysis for the target country and data class.

These boundaries are intentional so the college prototype does not claim production security it has not implemented.

## Architecture

### Current browser demonstration

    User
      │
      ▼
    Browser
      │  AES-256-GCM
      ▼
    Ciphertext
      │  split after encryption
      ▼
    Encrypted Block 01 ... Block N
      │
      ├── SHA-256 block verification
      │
      ▼
    Reconstruct ciphertext
      │
      ▼
    AES-GCM authentication + decryption
      │
      ▼
    Original file

### Production-oriented cloud blueprint

    Web Client
        │
        │ HTTPS
        ▼
    Identity / API Gateway
        │
        ├── short-lived upload authorization
        │
        ▼
    Browser-side encryption
        │
        ▼
    Encrypted blocks
        │
        ▼
    Private Object Storage (S3)
        │
        ├── lifecycle / versioning
        └── audit events
        │
        ▼
    CDN / CloudFront
        │
        ▼
    Global users

For a real deployment, authentication and authorization must be enforced by a backend or managed identity service. A static website alone cannot safely provide multi-user cloud-storage authorization.

## Cloud-ready package

The **Export encrypted package** action creates a JSON manifest containing:
- Format/version.
- Encryption algorithm and IV/tag configuration.
- Original file metadata.
- Block size and count.
- Whole-ciphertext SHA-256.
- Per-block SHA-256.
- Base64 ciphertext block payloads.

The package explicitly records that the encryption key was **not exported**. Therefore the exported package is useful as a cloud/storage representation but is not a self-contained recovery backup.

## Threat-model thinking

| Threat | Demonstration / mitigation |
|---|---|
| Cloud storage sees plaintext | Encrypt before storage |
| Ciphertext is modified | AES-GCM authentication + integrity checks |
| Block is modified | SHA-256 block verification |
| Block order is wrong | Explicit block indexes + reconstruction |
| Browser page is refreshed | Session key is lost; recovery requires future key-management design |
| Unauthorized cloud access | Production requirement: IAM, identity and authorization |
| Stolen session/browser context | Production requirement: strong identity, session controls and endpoint security |

## Assignment mapping

| College requirement | Implementation |
|---|---|
| Divide file into segments/blocks | Configurable encrypted block segmentation |
| Download/reconstruct file | Block reconstruction + AES-GCM decryption |
| Encrypted cloud representation | Ciphertext block model + exportable manifest |
| Portfolio/documentation website | Responsive product-style website |
| Amazon S3 | Documented private object-storage target |
| CDN | CloudFront architecture and deployment guide |
| HTTPS | GitHub Pages / CloudFront delivery |
| Extra engineering | Integrity checks, tamper lab, telemetry, package manifest and production roadmap |

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

No npm build is required.

    python -m http.server 8080

Open:

    http://localhost:8080

Use a modern browser with Web Crypto API support.

## Deploy

The repository includes a GitHub Pages Actions workflow. The project is published from the repository's main branch.

AWS S3 + CloudFront instructions are in `docs/AWS-CLOUDFRONT.md`.

Never place AWS access keys, secret keys, passwords or long-lived credentials in this public repository.

## Viva explanation

> “My project is a browser-first Secure Cloud Storage prototype. The user selects a file and the browser encrypts it using AES-256-GCM before any cloud transfer. The ciphertext is then divided into configurable blocks, each block is fingerprinted, and the complete encrypted payload can be represented as cloud objects. During download, blocks are verified and reconstructed, then AES-GCM authenticates and decrypts the original file. I also added a tamper-detection lab, a cloud-ready manifest and an AWS S3 plus CloudFront architecture for global HTTPS delivery.”

## Global product roadmap

To turn this prototype into a real multi-user service:

**Phase 1 — Identity**
- OIDC/passkeys/MFA.
- User and organization accounts.
- Role-based authorization.

**Phase 2 — Cloud data plane**
- Private S3 bucket.
- Backend-issued short-lived signed URLs.
- Object naming and tenant isolation.
- Upload/download resumability.

**Phase 3 — Key management**
- Envelope encryption.
- KMS/HSM-backed key hierarchy.
- Key rotation and revocation.
- Secure recovery workflows.

**Phase 4 — Reliability**
- Multipart/resumable transfers.
- Versioning and lifecycle policies.
- Backup and disaster recovery.
- Regional architecture where required.

**Phase 5 — Security operations**
- Central audit logs.
- Detection and alerting.
- Rate limiting and abuse controls.
- Automated security testing.
- Dependency and supply-chain controls.

**Phase 6 — Product**
- Sharing and permissions.
- Organization administration.
- Search and metadata controls.
- Usage/billing limits.
- Accessibility and internationalization.

## Security note

Cryptography is only one part of a secure storage system. AES-256-GCM protects the encrypted payload in this prototype, but real-world security also depends on identity, authorization, key management, cloud configuration, software supply chain, monitoring, recovery and operational controls.
