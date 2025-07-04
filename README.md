# Rently – Hệ sinh thái thuê trọ

> **Rently** là nền tảng end-to-end giúp kết nối _người thuê_, _chủ trọ_ và _ban quản trị_ thông qua trải nghiệm **tìm – đặt – ký – thanh toán** phòng trọ hoàn toàn số hoá.

---

## 🚀 Công nghệ chủ đạo

| Layer       | Stack                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client**  | Next.js 14 (App Router) · React 18 · TypeScript strict · Tailwind CSS · shadcn/ui · Radix UI · Zustand / React-Query · Mapbox GL · Zod · Jest + RTL |
| **Server**  | NestJS 10 · Prisma ORM · PostgreSQL · Redis · Socket.IO (WebSocket) · BullMQ (Job Queue) · Passport · class-validator                               |
| **DevOps**  | Docker Compose · GitHub Actions CI/CD · Vercel · Railway · Cloudinary · SePay (Payment Gateway)                                                     |
| **AI / ML** | OpenAI GPT-4o-mini                                                                                                                                  |

> Tất cả module tuân thủ **SOLID**, **Clean Architecture** và pattern **Modular Monorepo** để dễ mở rộng, test và maintain.

---

## ✨ Tính năng nổi bật

### 1. Quản lý tiện ích (Amenity)

- CRUD tiện ích, phân trang & tìm kiếm

### 2. Xác thực & Người dùng (Auth)

- Đăng ký, đăng nhập, refresh token, Google OAuth
- Gửi OTP, quên/đổi mật khẩu, đăng xuất

### 3. Chatbot AI

- Chat GPT-4o contextual, lưu lịch sử, chuyển phiên bản phân tích

### 4. Bình luận (Comment)

- Threaded comments, soft delete, edit, like & reply

### 5. Liên hệ (Contact)

- Form liên hệ, phản hồi qua email, job gửi email hàng loạt, tracking trạng thái

### 6. Yêu thích (Favorite)

- Lưu/bỏ lưu bài đăng, kiểm tra trạng thái, danh sách đã lưu

### 7. Đăng ký chủ trọ (Landlord Subscription)

- Gói subscription linh hoạt, auto-renew, thống kê doanh thu

### 8. Nhắn tin (Conversations & Messages)

- Chat real-time WebSocket, gửi file, edit, delete, read-receipt

### 9. Thông báo (Notification)

- Push real-time, phân loại, mark-as-read, đếm badge

### 10. Thanh toán (Payment)

- Tích hợp **SePay** QR code, webhook, xử lý rút tiền, thống kê giao dịch

### 11. Phân quyền (Permission & Role)

- RBAC đầy đủ, yêu cầu nâng cấp vai trò, kiểm tra access

### 12. Bài đăng cho thuê (Post)

- CRUD, bulk import, nearby, similar by price, same rental

### 13. Báo cáo bài đăng (Post Report)

- User report, admin review, thống kê theo trạng thái

### 14. Hồ sơ (Profile)

- Thông tin cá nhân, lịch sử thanh toán, Face Verification (optional)

### 15. Nhà trọ (Rental)

- CRUD rental, filter theo landlord, địa chỉ chuẩn hoá

### 16. Hợp đồng thuê (Rental Contract)

- Tạo/ký hợp đồng điện tử, template upload, xuất PDF, terminate & renew

### 17. Yêu cầu thuê (Rental Request)

- Tenant gửi request, landlord duyệt/từ chối, huỷ yêu cầu

### 18. Vai trò & Nâng cấp (Role & Upgrade Request)

- CRUD role, admin phê duyệt nâng cấp, thống kê

### 19. Phòng (Room)

- CRUD, bulk create 50 phòng, multi-images, amenities

### 20. Hoá đơn phòng (Room Bill)

- Tạo & gửi email hoá đơn, PDF, thanh toán online, lịch sử

### 21. Smart Search / AI Search

- pgvector + OpenAI semantic search, gợi ý, intent & criteria analyzer

### 22. Thống kê (Statistics Dashboard)

- Realtime KPI: doanh thu, phân phối phòng, khu vực hot

### 23. Cấu hình hệ thống (System Setting)

- Feature flag, email template, global constants

### 24. Upload (Cloudinary)

- Ảnh, video, tài liệu, file chat – auto optimize & signed URL

### 25. Quản trị người dùng (User Admin)

- Khoá/mở khoá, xoá, tìm kiếm nâng cao

### 26. Lịch hẹn xem phòng (Viewing Schedule)

- Tạo lịch, nhắc nhở qua email & push, ICS calendar export

> Toàn bộ **28 nhóm** và **100+ use cases** được mô hình hoá chi tiết trong `SoDo/usercase.drawio` 📐.

---

## 🏗️ Kiến trúc

```
apps/
 ├─ rently-client   # Next.js App Router (frontend)
 └─ rently-server   # NestJS (backend API)
packages/
 ├─ ui              # shadcn/ui + custom components
 ├─ config          # env, constants, eslint, tsconfig
 └─ lib             # shared utilities, hooks, types
```

- _Client_ và _Server_ giao tiếp qua **REST** + **WebSocket** (Events Gateway)
- Database schema quản lý bằng **Prisma Migrate**; seed script tự động
- **Redis** dùng cho cache, rate-limit và job queue (**BullMQ**)
- **Docker Compose** spin-up full-stack ➜ `docker compose up --build`

---

## ⚙️ Cài đặt nhanh

```bash
# 1. Clone repo
$ git clone https://github.com/your-username/rently.git && cd rently

# 2. Copy env
$ cp .env.example .env

# 3. Khởi tạo services (Postgres, Redis, Mailhog)
$ docker compose up ‑d db cache mailhog

# 4. Cài dependency & migrate DB
$ pnpm i && pnpm --filter rently-server prisma migrate deploy

# 5. Chạy song song frontend + backend
$ pnpm dev       # Turborepo chạy cả 2 apps
```

Truy cập http://localhost:3000 để trải nghiệm! ✨
