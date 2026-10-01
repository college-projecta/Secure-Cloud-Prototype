# Secure Cloud — Production Cloud Layer

This directory is the bridge between the browser prototype and a real multi-user cloud service.

## What it adds

- Amazon Cognito user identity.
- Authenticated API Gateway HTTP API.
- Private S3 bucket with public access blocked.
- Browser-to-S3 uploads through short-lived presigned PUT URLs.
- Browser-to-S3 downloads through short-lived presigned GET URLs.
- DynamoDB metadata owned by the authenticated Cognito subject.
- Per-user object namespaces: `users/<cognito-sub>/objects/<object-id>/block-XXXXXX`.
- S3 encryption at rest and versioning.
- Automatic cleanup of incomplete multipart uploads.
- No AWS credentials in the browser.

## Data flow

    Sign in with Cognito
          ↓
    Browser encrypts file
          ↓
    POST /v1/upload-session
          ↓
    API verifies identity
          ↓
    Presigned S3 PUT URLs
          ↓
    Browser uploads encrypted blocks directly to private S3
          ↓
    DynamoDB stores metadata / block map

For download:

    Browser → authenticated API
            → ownership check
            → short-lived S3 GET URLs
            → encrypted blocks
            → verify / reconstruct / AES-GCM decrypt locally

## Deploy with AWS SAM

Install AWS CLI and SAM CLI, configure an AWS profile, then:

    cd cloud
    npm install
    sam build
    sam deploy --guided

The guided deployment creates the Cognito pool, API, private S3 bucket and DynamoDB table.

### GitHub Actions

The repository also includes an AWS deployment workflow. For a real automated deployment, create an AWS IAM role trusted by GitHub's OIDC provider and add its ARN as the repository variable:

    AWS_DEPLOY_ROLE_ARN

The workflow uses short-lived GitHub OIDC credentials rather than storing a permanent AWS access key in GitHub.

## Production hardening before public use

- Add email verification, MFA and account recovery policy.
- Restrict CORS to the real application origin.
- Add request/body limits and rate limiting.
- Add object quotas and lifecycle rules.
- Store encryption manifests separately and validate every field.
- Add malware scanning where the use case requires it.
- Add audit logging and alerting.
- Add KMS customer-managed keys if the threat/compliance model requires them.
- Add backups and disaster recovery.
- Add security testing and dependency scanning.
- Never commit AWS credentials or Cognito secrets.

## Important key-management boundary

The browser encryption key is still deliberately local to the client. This means the cloud API cannot decrypt user content. A production recovery/share feature requires an explicit key-management design such as envelope encryption, device-bound keys, organization-managed keys or a user-controlled recovery mechanism.
