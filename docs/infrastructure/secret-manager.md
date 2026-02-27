---
id: secret-manager
title: Secret Manager
sidebar_label: Secret Manager
---

# Secret Manager

All ColabBoard services store sensitive configuration in **GCP Secret Manager**. Secrets are mounted into Cloud Run as environment variables at deploy time.

## Managed Secrets

| Secret Name | Service | Description |
|---|---|---|
| `colabboard-jwt-secret` | SSE Service, Session Service | HMAC-SHA256 JWT signing secret (min 32 chars) |

## Create Secrets

```bash
# Generate a strong random secret
$secret = [System.Web.Security.Membership]::GeneratePassword(48, 8)

# Create in Secret Manager
echo -n $secret | gcloud secrets create colabboard-jwt-secret \
  --data-file=- \
  --project=<PROJECT_ID>
```

## Rotate a Secret

```bash
# Add a new version
echo -n "<new-secret-value>" | gcloud secrets versions add colabboard-jwt-secret \
  --data-file=- \
  --project=<PROJECT_ID>

# Re-deploy Cloud Run to pick up the new version (if using :latest)
gcloud run deploy colabboard-sse --image gcr.io/<PROJECT_ID>/colabboard-sse:latest
```

## Reference in Cloud Run

```bash
gcloud run deploy colabboard-sse \
  --set-secrets JWT_SECRET=colabboard-jwt-secret:latest
```

## Required IAM

```bash
gcloud secrets add-iam-policy-binding colabboard-jwt-secret \
  --member="serviceAccount:<SERVICE_ACCOUNT>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
