# Học Viện Công Nghệ TECHACADEMY - Monorepo

Dự án này là hệ thống quản lý và đăng ký khóa học trực tuyến với Frontend bằng React (Vite) + CSS thuần, Backend bằng Golang + SQLite, và bộ test automation 30 test cases sử dụng Playwright.

---

## 🛠️ Công nghệ Sử dụng

*   **Backend:** Golang 1.22+ (sử dụng Router Go 1.22+ tiêu chuẩn, thư viện SQLite thuần Go `modernc.org/sqlite` không cần CGO).
*   **Frontend:** ReactJS + Vite + Vanilla CSS (Giao diện Premium Dark Mode, responsive, micro-animations, glassmorphism).
*   **Database:** SQLite (lưu trong `./backend/data/courses.db`, tự động khởi tạo và seed dữ liệu mẫu).
*   **Testing:** Playwright JS (30 testcases chạy tuần tự để cách ly trạng thái database, tự động gọi `/api/reset` trước mỗi test).
*   **DevOps:** Docker, Docker Compose, Nginx.

---

## 📂 Cấu trúc Dự án

```text
baigiuaky/
├── backend/                # Mã nguồn Golang
│   ├── main.go             # Entrypoint chính
│   ├── database/           # Init DB, Schema & Queries
│   ├── handlers/           # HTTP Handlers & APIs
│   ├── models/             # Định nghĩa cấu trúc dữ liệu
│   └── Dockerfile          # Build image backend
├── frontend/               # Mã nguồn React (Vite)
│   ├── src/                # File jsx, CSS, components
│   ├── index.html
│   ├── nginx.conf          # Nginx proxy định tuyến API
│   └── Dockerfile          # Build image frontend (static + Nginx proxy)
├── test/                   # Playwright Tests
│   ├── tests/              # 3 file test (mỗi file 10 test cases)
│   ├── playwright.config.js
│   └── package.json
├── docker-compose.yml      # Orchestration frontend & backend
└── README.md
```

---

## 🚀 Hướng dẫn Chạy cục bộ (Development)

Để chạy dự án cục bộ mà không qua Docker, hãy thực hiện các bước sau:

### Bước 1: Khởi chạy Backend Go
Mở Terminal 1:
```bash
cd backend
go mod tidy
go run main.go
```
*Backend sẽ chạy trên cổng `8080`.*

### Bước 2: Khởi chạy Frontend React
Mở Terminal 2:
```bash
cd frontend
npm install
npm run dev
```
*Frontend sẽ chạy trên cổng `3000` (được cấu hình proxy tự động chuyển tiếp `/api` về `http://localhost:8080`).*

---

## 🧪 Hướng dẫn Chạy Test Playwright

Bộ test gồm **30 kịch bản test** kiểm thử 3 tính năng: Tìm kiếm (10 TCs), Đánh giá (10 TCs) và Đăng ký (10 TCs).

Mở Terminal 3 (Đảm bảo cả Backend và Frontend vẫn đang chạy):
```bash
cd test
npm install
npx playwright install chromium
npx playwright test
```

### 🔴 Danh sách 3 Lỗi Cố ý (Intentional Bugs) sẽ FAIL tests:

Để phục vụ báo cáo kiểm thử môn học, hệ thống được cấu hình cố tình có 3 lỗi khiến 3 testcase sau bị **FAILED**:

1.  **TC-10 (Tính năng Tìm kiếm):** Tìm kiếm với từ khóa cực dài (> 200 ký tự).
    *   *Mô tả lỗi:* Frontend không chặn chiều dài chuỗi gửi đi. Backend khi nhận được chuỗi dài > 200 ký tự sẽ trả về lỗi HTTP 500. Playwright assert trang không bị lỗi hệ thống nên test case này sẽ **FAILED**.
2.  **TC-20 (Tính năng Đánh giá):** Click nút "Gửi" đánh giá liên tục (Spam).
    *   *Mô tả lỗi:* Frontend không disable nút submit. Backend thực hiện ghi dữ liệu có độ trễ nhỏ (`150ms`), dẫn đến lỗi xung đột dữ liệu (race condition), tạo ra 2 bản ghi đánh giá giống nhau của cùng 1 người dùng trên cùng 1 khóa học. Playwright assert chỉ tồn tại duy nhất 1 đánh giá của user đó nên test case này sẽ **FAILED**.
3.  **TC-30 (Tính năng Đăng ký):** Hủy bỏ thanh toán trong modal thanh toán của khóa học trả phí.
    *   *Mô tả lỗi:* Khi người dùng nhấn nút "Hủy thanh toán", backend vẫn ghi nhận và cập nhật trạng thái là `completed` thay vì từ chối. Người dùng vẫn được đăng ký học thành công mà không mất phí. Playwright assert màn hình "Khóa học của tôi" phải trống nên test case này sẽ **FAILED**.

---

## 🐳 Triển khai với Docker Compose

Để đóng gói và deploy cả hệ thống lên môi trường staging (hoặc GCP VM):

### 1. Khởi chạy và build mới hệ thống:
```bash
# Build các image mới và chạy container ở chế độ background (dưới nền)
docker-compose up -d --build
```

### 2. Dừng hệ thống:
```bash
# Dừng và xóa các container nhưng vẫn giữ lại dữ liệu trong volume SQLite
docker-compose down
```

### 3. Dừng hệ thống và reset sạch dữ liệu Database:
```bash
# Dừng container và xóa luôn volume lưu database SQLite (khởi tạo lại sạch từ đầu)
docker-compose down -v
```

### 4. Lệnh dừng rồi build/chạy lại nhanh (Một dòng lệnh):
```bash
docker-compose down && docker-compose up -d --build
```

### 5. Xem log trực tiếp của hệ thống:
```bash
docker-compose logs -f
```

*Sau khi chạy, truy cập ứng dụng tại `http://localhost:3000` (Frontend Nginx container tự động proxy mọi API `/api/*` về backend Go container).*
