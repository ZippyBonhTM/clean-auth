# Deploy (Railway + Docker Hub)

## Publish image

```bash
docker login
cd /home/zippy/clean-auth
npm run docker:publish -- <DOCKERHUB_USER> <VERSION_TAG>
```

Image names:

- `<DOCKERHUB_USER>/clean-auth:<VERSION_TAG>`
- `<DOCKERHUB_USER>/clean-auth:latest`

## Railway env vars

Use `/home/zippy/clean-auth/railway.env.example` as template.

Required values:

- `NODE_ENV=production`
- `DATA_SOURCE=mongo`
- `MONGO_URI=<YOUR_AUTH_MONGO_URI>`
- `JWT_ACCESS_SECRET=<STRONG_SECRET>`
- `JWT_REFRESH_SECRET=<STRONG_SECRET>`
- `CORS_ORIGINS=https://<FRONTEND_DOMAIN>`
- `COOKIE_SAME_SITE=none`
- `COOKIE_SECURE=true`

Notes:

- Railway injects `PORT` automatically.
- `APPLICATION_PORT` is optional fallback.
