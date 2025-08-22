# admin-spa/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
# 🔹 devDependencies까지 설치
RUN npm ci --include=dev || npm i --include=dev

COPY . .
ARG VITE_BASE=/admin/
ENV VITE_BASE=${VITE_BASE}

# 타입체크 + 빌드 (package.json의 "build": "tsc -b && vite build")
RUN npm run build

# ---- Runtime ----
FROM nginx:1.27-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/admin/
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
