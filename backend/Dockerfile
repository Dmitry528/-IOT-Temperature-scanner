FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install

COPY . .

RUN pnpm prisma:generate

RUN pnpm build

EXPOSE 8080

CMD ["pnpm", "start"]