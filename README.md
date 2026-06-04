# Học Viện Công Nghệ TECHACADEMY - Monorepo

Dự án này là hệ thống quản lý và đăng ký khóa học trực tuyến với Frontend bằng React (Vite) + CSS thuần, Backend bằng Golang + SQLite, và bộ test automation 64 test cases sử dụng Playwright.

---

## 🛠️ Công nghệ Sử dụng

*   **Backend:** Golang 1.22+ (sử dụng Router Go 1.22+ tiêu chuẩn, thư viện SQLite thuần Go `modernc.org/sqlite` không cần CGO).
*   **Frontend:** ReactJS + Vite + Vanilla CSS (Giao diện Premium Dark Mode, responsive, micro-animations, glassmorphism).
*   **Database:** SQLite (lưu trong `./backend/data/courses.db`, tự động khởi tạo và seed dữ liệu mẫu).
*   **Testing:** Playwright JS (64 testcases chạy tuần tự để cách ly trạng thái database, tự động gọi `/api/reset` trước mỗi test).
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
│   ├── tests/              # 4 file test (tổng cộng 64 test cases)
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

Bộ test gồm **64 kịch bản test** kiểm thử 4 tính năng: Tìm kiếm (10 TCs), Đánh giá (16 TCs), Đăng ký (22 TCs) và Danh sách yêu thích - Wishlist (16 TCs). Trong đó **8 test FAIL** do các lỗi cố ý (xem danh sách bên dưới).

Mở Terminal 3 (Đảm bảo cả Backend và Frontend vẫn đang chạy):
```bash
cd test
npm install
npx playwright install chromium
npx playwright test
```

### 🔴 Danh sách Lỗi Cố ý (Intentional Bugs) sẽ FAIL tests:

Để phục vụ báo cáo kiểm thử môn học, hệ thống được cấu hình cố tình có các lỗi thực tế khiến những testcase sau bị **FAILED**:

1.  **TC-09 (Tính năng Tìm kiếm):** Tìm kiếm với từ khóa cực dài (> 200 ký tự).
    *   *Mô tả lỗi:* Frontend không chặn chiều dài chuỗi gửi đi. Backend khi nhận được chuỗi dài > 200 ký tự sẽ trả về lỗi HTTP 500 (Internal Server Error) do tràn bộ đệm xử lý chuỗi thay vì chặn lỗi biên từ xa. Playwright assert lỗi không xuất hiện trên UI nên test case này sẽ **FAILED**.
2.  **TC-23 (Tính năng Đánh giá):** Click nút "Gửi" đánh giá liên tục (Spam).
    *   *Mô tả lỗi:* Frontend không disable nút submit. Backend thực hiện ghi dữ liệu có độ trễ nhỏ (`150ms`), dẫn đến lỗi xung đột dữ liệu (race condition), tạo ra 2 bản ghi đánh giá của cùng 1 người dùng trên cùng 1 khóa học. Playwright assert chỉ tồn tại duy nhất 1 đánh giá của user đó nên test case này sẽ **FAILED**.
3.  **TC-24 (Tính năng Đánh giá):** Chặn lỗ hổng bảo mật XSS (Cross-Site Scripting) thông qua bình luận.
    *   *Mô tả lỗi:* Frontend hiển thị bình luận qua `dangerouslySetInnerHTML` để hỗ trợ `<br />` xuống dòng nhưng không lọc thẻ HTML độc hại, dẫn đến việc chèn và thực thi được đoạn script `<img onerror="..." />`, làm thay đổi biến toàn cục `window.xssDetected = true` khiến test case phát hiện ra lỗ hổng và **FAILED**.
4.  **TC-59 (Tính năng Danh sách yêu thích):** Click liên tục (Spam) nút yêu thích khóa học.
    *   *Mô tả lỗi:* Frontend không disable nút bấm hoặc không áp dụng debounce/throttle, backend bị lỗi xung đột UNIQUE constraint của SQLite và trả về lỗi HTTP 500 khiến Playwright phát hiện lỗi và **FAILED**.
5.  **TC-61 (Tính năng Tìm kiếm):** Lọc kết hợp danh mục + mức học phí.
    *   *Mô tả lỗi:* Backend dùng `else-if` giữa điều kiện danh mục và điều kiện giá, nên khi đã chọn danh mục thì bộ lọc giá bị bỏ qua. Chọn "Go" + "Có phí" đáng lẽ ra 1 khóa nhưng trả về 2 khóa Go khiến test **FAILED**.
6.  **TC-62 (Tính năng Đánh giá):** Điểm trung bình không được làm tròn ở trang chi tiết.
    *   *Mô tả lỗi:* Trang chi tiết khóa học quên gọi `.toFixed(1)` nên điểm trung bình hiển thị nguyên số thực (ví dụ `3.3333333333333335` thay vì `3.3`), test so khớp chính xác phát hiện và **FAILED**.
7.  **TC-63 (Tính năng Đăng ký):** Số tiền thực thu khi có mã giảm giá không được làm tròn.
    *   *Mô tả lỗi:* Backend tính `49.99 * 0.8` bằng float và trả về `amount` chưa làm tròn 2 chữ số (`39.992000000000004`); frontend hiển thị thẳng vào thông báo nên lộ số lẻ sai, test **FAILED**.
8.  **TC-64 (Tính năng Đăng ký):** Khóa "chờ thanh toán" (pending) bị ẩn khỏi "Khóa học của tôi".
    *   *Mô tả lỗi:* API `/api/my-courses` chỉ lọc `status = 'completed'`, nên khóa trả phí đang chờ xác nhận thanh toán bị loại khỏi danh sách. Học viên đã đăng ký nhưng không thấy khóa của mình, test **FAILED**.

> ✅ Ngoài ra phần **tìm kiếm đã được cải tiến**: bỏ dấu tiếng Việt, không phân biệt hoa/thường theo chuẩn Unicode (kể cả "CƠ BẢN" / "co ban"), tách từ khớp không cần đúng thứ tự, và tìm cả trên tên giảng viên / danh mục.

---

## 🐳 Triển khai với Docker Compose

Để đóng gói và deploy cả hệ thống lên môi trường staging (hoặc GCP VM):

### 1. Khởi chạy và build mới hệ thống:
```bash
# Build các image mới và chạy container ở chế độ background (dưới nền)
docker compose up -d --build
```

### 2. Dừng hệ thống:
```bash
# Dừng và xóa các container nhưng vẫn giữ lại dữ liệu trong volume SQLite
docker compose down
```

### 3. Dừng hệ thống và reset sạch dữ liệu Database:
```bash
# Dừng container và xóa luôn volume lưu database SQLite (khởi tạo lại sạch từ đầu)
docker compose down -v
```

### 4. Lệnh dừng rồi build/chạy lại nhanh (Một dòng lệnh):
```bash
docker compose down && docker compose up -d --build
```

### 5. Xem log trực tiếp của hệ thống:
```bash
docker compose logs -f
```

*Sau khi chạy, truy cập ứng dụng tại `http://localhost:3000` (Frontend Nginx container tự động proxy mọi API `/api/*` về backend Go container).*
