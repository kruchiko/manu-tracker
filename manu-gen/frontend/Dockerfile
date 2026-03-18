FROM node:24.14.0-slim

WORKDIR /app

COPY .yarnrc.yml package.json yarn.lock ./
RUN corepack enable && corepack prepare yarn@4.12.0 --activate && yarn install

COPY tsconfig*.json vite.config.ts index.html ./
COPY public/ public/
COPY src/ src/

EXPOSE 5173

CMD ["yarn", "dev", "--host"]
