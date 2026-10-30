# SnapDeploy entry point: repo-root Dockerfile (SnapDeploy only looks at the root).
# Mirrors the goal layout so backend/src/config.js resolves paths unchanged:
#   /app/backend/src/server.js, /app/products, /app/shop-banner.png, /app/shop-profile.png
FROM node:24-slim
WORKDIR /app
COPY backend ./backend
COPY products ./products
COPY shop-banner.png ./shop-banner.png
COPY shop-profile.png ./shop-profile.png
RUN mkdir -p /app/backend/data
EXPOSE 3000
ENV HOST=0.0.0.0 SMS_OTP_ENABLED=false
CMD ["node", "backend/src/server.js"]
