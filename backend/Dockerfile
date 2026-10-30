# Generic container image for the Asif Traders backend (FREE design).
# Zero dependencies; runs anywhere a container can run.
# At run time the container ALSO needs the shop pictures, which live
# outside this folder in the goal folder: mount or copy them and set
# IMAGES_DIR, BANNER_PATH and PROFILE_PATH accordingly (see .env.example).
# Example:
#   docker build -t asif-traders-backend .
#   docker run -p 3000:3000 -e HOST=0.0.0.0 -e SMS_OTP_ENABLED=false \
#     -v /path/to/products:/data/products \
#     -e IMAGES_DIR=/data/products \
#     -e BANNER_PATH=/data/shop-banner.png \
#     -e PROFILE_PATH=/data/shop-profile.png \
#     asif-traders-backend
FROM node:24-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
EXPOSE 3000
ENV HOST=0.0.0.0 SMS_OTP_ENABLED=false
CMD ["node", "src/server.js"]
