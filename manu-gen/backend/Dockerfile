FROM node:24.14.0-slim

WORKDIR /app

COPY .yarnrc.yml package.json yarn.lock ./
RUN corepack enable && corepack prepare yarn@4.12.0 --activate && yarn install

COPY tsconfig.json ./
COPY src/ src/

EXPOSE 3000

CMD ["yarn", "dev"]
