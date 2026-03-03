# 1) build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./
COPY pnpm-lock.yaml* ./

RUN corepack enable
RUN if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm i; fi

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN if [ -f pnpm-lock.yaml ]; then pnpm build; else npm run build; fi

# 2) serve (nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA 라우팅용 nginx 설정 덮어쓰기 
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80