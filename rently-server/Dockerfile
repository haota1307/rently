FROM node:22.2.0-alpine AS builder

# Thiết lập múi giờ Việt Nam
ENV TZ=Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Cài đặt các phụ thuộc cần thiết
RUN apk add --no-cache openssl

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Sao chép mã nguồn và prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build ứng dụng
RUN npm run build

# Kiểm tra xem file main đã được tạo chưa
RUN ls -la dist/ && echo "Kiểm tra file main.js:" && ls -la dist/src/main.js

# Stage production
FROM node:22.2.0-alpine AS production

# Thiết lập múi giờ Việt Nam
ENV TZ=Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Thiết lập biến môi trường cho môi trường production
ENV NODE_ENV=production
ENV PORT=4000

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies chỉ cho production
RUN npm ci --only=production

# Sao chép prisma schema (cho prisma generate nếu cần)
COPY prisma ./prisma/

# Sao chép toàn bộ thư mục dist từ builder
COPY --from=builder /app/dist /app/dist

# Sao chép các module prisma cần thiết
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Kiểm tra cấu trúc thư mục và file
RUN echo "Cấu trúc thư mục:" && ls -la && echo "Thư mục dist:" && ls -la /app/dist && echo "Thư mục dist/src:" && ls -la /app/dist/src

# Các biến môi trường sẽ được truyền vào từ docker-compose hoặc file .env
# KHÔNG hardcode các giá trị nhạy cảm trong Dockerfile

# Mở cổng ứng dụng
EXPOSE 4000

# Khởi chạy ứng dụng với đường dẫn chính xác
CMD ["node", "dist/src/main.js"]