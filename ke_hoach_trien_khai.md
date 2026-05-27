# Kế hoạch Triển khai Web khóa học & Kế hoạch Kiểm thử Playwright

Tài liệu này trình bày kế hoạch chi tiết để xây dựng, cấu hình máy chủ, deploy Docker/Nginx và thiết kế 30 testcases sử dụng Playwright cho trang web **khoahoc.phongngohong.online**.

---

## 1. Đề xuất cấu hình VM Instance trên Google Cloud Platform (GCP)

Để chạy một ứng dụng web thử nghiệm bao gồm Frontend, Backend, Database và Nginx thông qua Docker, cấu hình sau là tối ưu nhất về mặt chi phí và hiệu năng:

*   **Machine Type (Loại máy ảo):** `e2-small` (2 vCPUs, 2 GB RAM).
    *   *Lý do:* `e2-micro` (1 GB RAM) có thể bị quá tải khi build Docker hoặc chạy đồng thời nhiều container. `e2-small` là lựa chọn cân bằng và chi phí rất rẻ (khoảng ~$12/tháng).
*   **Hệ điều hành (OS):** `Ubuntu 24.04 LTS` hoặc `Debian 12`.
*   **Disk (Ổ đĩa):** `20 GB Balanced Persistent Disk` (hoặc SSD để tốc độ đọc ghi nhanh hơn).
*   **Firewall (Tường lửa):** Cho phép lưu lượng **HTTP** (cổng 80) và **HTTPS** (cổng 443).

---

## 2. Kiến trúc Hệ thống & Sơ đồ Deployment

Hệ thống sẽ được container hóa bằng Docker và điều phối qua Docker Compose để chạy trên VM GCP.

```mermaid
graph TD
    User([Người dùng / Playwright]) -->|HTTPS: khoahoc.phongngohong.online| NginxHost[Nginx trên Host VM]
    NginxHost -->|Reverse Proxy| FEContainer[Docker Frontend: React/Vite - Cổng 80]
    NginxHost -->|Reverse Proxy| BEContainer[Docker Backend: Golang - Cổng 8080]
    BEContainer -->|Kết nối| Database[(Database: SQLite)]
```

### Chi tiết các thành phần:
1.  **Nginx (Host VM):** Cài trực tiếp trên OS của VM để quản lý SSL Certbot (Let's Encrypt) cho tên miền `khoahoc.phongngohong.online`, sau đó reverse proxy vào Docker container.
2.  **Frontend Container:** Chạy React (Vite) + CSS/Tailwind. Được build và đóng gói bằng Nginx tĩnh trong Docker.
3.  **Backend Container:** Chạy ứng dụng Golang (sử dụng Gin hoặc Fiber) cung cấp các REST API phục vụ tìm kiếm, đánh giá và đăng ký.
4.  **Database:** Đề xuất dùng **SQLite** (được mount volume ra ngoài để lưu trữ). SQLite rất nhẹ, không tốn thêm tài nguyên RAM chạy container Database, và đặc biệt là cực kỳ dễ reset trạng thái dữ liệu (chỉ cần ghi đè file `.db` gốc) khi chạy test tự động.

---

## 3. Cấu trúc thư mục dự án (Monorepo)

Toàn bộ mã nguồn backend, frontend và testcases sẽ nằm chung một thư mục gốc để dễ quản lý và deploy:

```text
baigiuaky/
├── backend/                # Mã nguồn Golang
│   ├── main.go
│   ├── database/
│   ├── handlers/
│   ├── models/
│   ├── Dockerfile
│   └── data/               # Thư mục lưu database SQLite
│       └── courses.db
├── frontend/               # Mã nguồn React (Vite)
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── test/                   # Thư mục chứa kịch bản Playwright
│   ├── tests/
│   │   ├── search.spec.js
│   │   ├── review.spec.js
│   │   └── register.spec.js
│   ├── playwright.config.js
│   └── package.json
├── docker-compose.yml      # Cấu hình khởi chạy frontend + backend
└── README.md
```

---

## 4. Kế hoạch Thiết kế 30 Test Cases Playwright

Nhóm sẽ thực hiện tổng cộng **30 kịch bản test** cho 3 tính năng cốt lõi. Để phục vụ môn học kiểm thử, chúng ta sẽ cố tình thiết kế một số bug hợp lý ở Backend hoặc Frontend khiến một vài test case bị **FAILED**.

### Tính năng 1: Tìm kiếm khóa học (10 Test Cases)
*   **TC-01:** Tìm kiếm với từ khóa chính xác (VD: "Golang") -> Hiển thị danh sách khóa học Golang.
*   **TC-02:** Tìm kiếm không phân biệt chữ hoa/chữ thường (VD: "golang" và "GOLANG") -> Kết quả trả về giống nhau.
*   **TC-03:** Tìm kiếm với từ khóa không tồn tại -> Hiển thị thông báo "Không tìm thấy khóa học nào phù hợp".
*   **TC-04:** Tìm kiếm khi để trống ô nhập -> Hiển thị toàn bộ danh sách khóa học hoặc yêu cầu nhập từ khóa.
*   **TC-05:** Tìm kiếm chứa ký tự đặc biệt (VD: `@#$%^&*`) -> Xử lý an toàn, không lỗi hệ thống.
*   **TC-06:** Lọc khóa học theo danh mục (Category) -> Hiển thị đúng khóa học của danh mục đó.
*   **TC-07:** Lọc khóa học theo mức giá (Miễn phí / Trả phí) -> Kết quả hiển thị đúng giá.
*   **TC-08:** Tìm kiếm kết hợp vừa nhập từ khóa vừa chọn bộ lọc danh mục.
*   **TC-09:** Nhấp vào kết quả tìm kiếm -> Chuyển hướng đúng về trang chi tiết khóa học.
*   **TC-10 (FAILED Ý ĐỒ):** Tìm kiếm với từ khóa có độ dài cực lớn (> 200 ký tự) -> *Ý đồ lỗi:* Frontend không giới hạn ký tự nhập gửi lên backend, backend trả về lỗi HTTP 500 hoặc crash nhẹ thay vì hiển thị thông báo lỗi thân thiện (hoặc Frontend hiển thị vỡ layout).

### Tính năng 2: Đánh giá khóa học (10 Test Cases)
*   **TC-11:** Gửi đánh giá thành công khi nhập đầy đủ thông tin (chọn số sao từ 1-5 và viết bình luận).
*   **TC-12:** Đánh giá khóa học khi chưa đăng nhập -> Hệ thống yêu cầu đăng nhập trước khi đánh giá.
*   **TC-13:** Đánh giá để trống phần bình luận nhưng chọn số sao -> Cho phép gửi đánh giá (chỉ có sao).
*   **TC-14:** Đánh giá với số sao bằng 0 (chưa chọn sao) nhưng có bình luận -> Báo lỗi yêu cầu chọn số sao.
*   **TC-15:** Kiểm tra độ dài bình luận tối thiểu (VD: ít nhất 3 ký tự).
*   **TC-16:** Kiểm tra độ dài bình luận tối đa (VD: tối đa 500 ký tự, chặn nhập thêm).
*   **TC-17:** Đánh giá của người dùng hiện lên ngay lập tức ở đầu danh sách đánh giá sau khi gửi thành công.
*   **TC-18:** Một tài khoản đánh giá nhiều lần trên cùng 1 khóa học -> Hệ thống chỉ cho phép cập nhật đánh giá cũ hoặc báo lỗi.
*   **TC-19:** Hiển thị điểm đánh giá trung bình cập nhật chính xác sau khi thêm đánh giá mới.
*   **TC-20 (FAILED Ý ĐỒ):** Spam gửi đánh giá bằng cách click liên tục vào nút "Gửi" -> *Ý đồ lỗi:* Frontend không disable nút gửi hoặc không áp dụng debounce/throttle, dẫn đến việc backend tạo ra nhiều bản ghi trùng lặp từ một lượt gửi, Playwright assert số lượng đánh giá tăng lên không hợp lệ.

### Tính năng 3: Đăng ký học (10 Test Cases)
*   **TC-21:** Đăng ký khóa học miễn phí thành công -> Vào thẳng lớp học (trang bài học).
*   **TC-22:** Đăng ký khóa học có phí -> Chuyển hướng sang trang thanh toán/quét mã QR.
*   **TC-23:** Đăng ký học khi chưa đăng nhập -> Chuyển hướng sang trang Đăng nhập và sau khi đăng nhập thành công tự động quay lại đăng ký tiếp.
*   **TC-24:** Đăng ký một khóa học đã đăng ký trước đó -> Hệ thống báo lỗi "Bạn đã đăng ký khóa học này rồi" và đổi nút thành "Vào học ngay".
*   **TC-25:** Kiểm tra thông tin khóa học hiển thị chính xác trong danh sách "Khóa học của tôi" sau khi đăng ký thành công.
*   **TC-26:** Hủy đăng ký khóa học (nếu hệ thống hỗ trợ hủy) -> Khóa học biến mất khỏi danh sách "Khóa học của tôi".
*   **TC-27:** Đăng ký học khi số lượng học viên tối đa của khóa học đã đạt giới hạn -> Báo lỗi khóa học đã đầy.
*   **TC-28:** Nhập mã giảm giá (Coupon) hợp lệ khi đăng ký khóa học trả phí -> Giá tiền được giảm chính xác.
*   **TC-29:** Nhập mã giảm giá đã hết hạn -> Báo lỗi mã không hợp lệ.
*   **TC-30 (FAILED Ý ĐỒ):** Click đăng ký khóa học trả phí nhưng giả lập lỗi mạng / hủy thanh toán -> *Ý đồ lỗi:* Backend vẫn ghi nhận đăng ký thành công và cho phép vào học mà không cần thanh toán (lỗi logic nghiệp vụ cực kỳ nghiêm trọng, rất thích hợp để làm báo cáo kiểm thử).

---

## 6. Quy trình phối hợp triển khai tiếp theo

1.  **Bước 1:** Bạn xem qua bản kế hoạch này và điều chỉnh nếu cần thiết.
2.  **Bước 2:** Setup hạ tầng GCP (Bạn thực hiện tạo VM Instance và cấu hình Domain trỏ về IP của VM).
3.  **Bước 3:** Phát triển Backend Golang & Database SQLite mẫu.
4.  **Bước 4:** Phát triển Frontend React (Vite) tối giản nhưng trực quan, gắn các thuộc tính `data-testid` để test dễ dàng.
5.  **Bước 5:** Viết bộ test Playwright trong thư mục `test/` và cấu hình chạy test.
6.  **Bước 6:** Đóng gói bằng Docker và deploy lên GCP, cài đặt Nginx + SSL.
