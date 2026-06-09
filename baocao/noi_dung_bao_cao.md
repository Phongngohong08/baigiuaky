# BÁO CÁO KIỂM THỬ PHẦN MỀM

**Đề tài:** KIỂM THỬ MỘT SỐ CHỨC NĂNG CỦA TRANG WEB HỌC TRỰC TUYẾN BẰNG CÔNG CỤ PLAYWRIGHT

> Ghi chú sử dụng tài liệu:
> - Toàn bộ nội dung chữ đã được viết đầy đủ, bạn chỉ cần copy vào file `bc.docx`.
> - Những chỗ ghi `📷 [HÌNH x.x: ...]` là vị trí bạn tự chèn ảnh chụp màn hình.
> - Các bảng đã được điền sẵn dữ liệu dưới dạng markdown, bạn copy vào Word và format lại thành bảng.
> - Website kiểm thử: **https://khoahoc.phongngohong.online** (Học Viện Công Nghệ TECHACADEMY).

---

## LỜI NÓI ĐẦU

Trong thời đại số hóa, các ứng dụng web đã trở thành một phần không thể thiếu trong đời sống và công việc, đặc biệt là các nền tảng học trực tuyến (e-learning). Để đáp ứng nhu cầu ngày càng cao của người dùng, một trang web không chỉ cần đầy đủ chức năng mà còn phải hoạt động ổn định, chính xác và an toàn. Tuy nhiên, việc kiểm tra thủ công toàn bộ chức năng sau mỗi lần thay đổi mã nguồn tốn rất nhiều thời gian và dễ bỏ sót lỗi. Vì vậy, các công cụ kiểm thử tự động đã trở thành một phần thiết yếu trong quy trình phát triển và bảo trì phần mềm hiện đại.

Trong báo cáo này, nhóm chúng em xây dựng một website học trực tuyến hoàn chỉnh (**Học Viện Công Nghệ TECHACADEMY**) gồm Frontend (ReactJS), Backend (Golang) và Cơ sở dữ liệu (SQLite), sau đó sử dụng công cụ kiểm thử tự động **Playwright** để kiểm thử một số chức năng cốt lõi của hệ thống. Mục đích của báo cáo là đánh giá mức độ hoạt động của trang web, phát hiện các lỗi tiềm ẩn trong chức năng và đề xuất giải pháp nhằm nâng cao chất lượng phần mềm.

Nhóm chúng em đã thiết kế và thực thi **64 ca kiểm thử (test cases)** cho 4 nhóm chức năng: Tìm kiếm & Lọc khóa học, Đánh giá khóa học, Đăng ký & Thanh toán, và Danh sách yêu thích (Wishlist). Trong đó, nhóm chủ động cài đặt một số lỗi cố ý mang tính thực tế để minh họa khả năng phát hiện lỗi của bộ kiểm thử tự động.

Nội dung báo cáo gồm các phần:

- **CHƯƠNG 1: KIỂM THỬ WEB BẰNG CÔNG CỤ PLAYWRIGHT** — Giới thiệu công cụ Playwright, các thành phần và tính năng chính, quy trình làm việc và so sánh với các công cụ kiểm thử tự động khác.
- **CHƯƠNG 2: XÂY DỰNG KẾ HOẠCH KIỂM THỬ** — Giới thiệu website kiểm thử, lập kế hoạch, phân chia công việc, tài nguyên, chiến lược kiểm thử và quy trình quản lý lỗi.
- **CHƯƠNG 3: TIẾN HÀNH CÀI ĐẶT VÀ DEMO THỰC NGHIỆM VỚI CÔNG CỤ PLAYWRIGHT** — Cài đặt môi trường, viết kịch bản kiểm thử và thực thi test.
- **CHƯƠNG 4: KẾT LUẬN** — Trình bày kết quả đạt được, hạn chế và hướng phát triển.

Trong quá trình thực hiện, nhóm đã cố gắng hết sức nhưng khó tránh khỏi thiếu sót, kính mong thầy/cô đóng góp ý kiến để đề tài được hoàn thiện hơn. Chúng em xin chân thành cảm ơn!

---

## DANH MỤC TỪ VIẾT TẮT

| Từ viết tắt | Giải thích đầy đủ |
|---|---|
| API | Application Programming Interface (Giao diện lập trình ứng dụng) |
| HTTP | HyperText Transfer Protocol (Giao thức truyền tải siêu văn bản) |
| UI | User Interface (Giao diện người dùng) |
| UX | User Experience (Trải nghiệm người dùng) |
| DOM | Document Object Model (Mô hình đối tượng tài liệu) |
| SQL | Structured Query Language (Ngôn ngữ truy vấn có cấu trúc) |
| XSS | Cross-Site Scripting (Tấn công chèn mã kịch bản) |
| CI/CD | Continuous Integration / Continuous Deployment |
| TC | Test Case (Ca kiểm thử) |
| VM | Virtual Machine (Máy ảo) |

---

# CHƯƠNG 1. KIỂM THỬ WEB BẰNG CÔNG CỤ PLAYWRIGHT

## 1.1 Tổng quan về công cụ Playwright

### 1.1.1 Giới thiệu

Playwright là một thư viện (framework) kiểm thử tự động mã nguồn mở do Microsoft phát triển và phát hành lần đầu vào năm 2020. Playwright được sử dụng rộng rãi để tự động hóa việc kiểm thử các ứng dụng web hiện đại trên nhiều trình duyệt như Chromium (Google Chrome, Microsoft Edge), Firefox và WebKit (Safari).

Khác với các công cụ thế hệ cũ vốn điều khiển trình duyệt thông qua một lớp trung gian, Playwright giao tiếp trực tiếp với trình duyệt thông qua giao thức điều khiển cấp thấp (DevTools Protocol). Nhờ đó, Playwright có tốc độ thực thi nhanh, độ ổn định cao và đặc biệt là cơ chế **auto-waiting** (tự động chờ phần tử sẵn sàng) giúp giảm thiểu các lỗi kiểm thử chập chờn (flaky test) thường gặp.

Playwright cho phép viết kịch bản kiểm thử bằng nhiều ngôn ngữ lập trình như JavaScript/TypeScript, Python, Java và C#. Trong đề tài này, nhóm sử dụng Playwright với ngôn ngữ **JavaScript** để kiểm thử các chức năng của website học trực tuyến TECHACADEMY.

Mục tiêu của Playwright là giúp lập trình viên và kiểm thử viên tiết kiệm thời gian, tự động hóa các kịch bản kiểm thử lặp đi lặp lại thay vì thực hiện thủ công, đồng thời đảm bảo chất lượng phần mềm một cách nhất quán qua từng phiên bản.

📷 [HÌNH 1.1: Trang chủ và logo của công cụ Playwright (playwright.dev)]

### 1.1.2 Các thành phần chính của Playwright

Playwright được tổ chức thành nhiều thành phần phối hợp với nhau, trong đó các thành phần chính bao gồm:

**a) Playwright Library (Thư viện lõi)**

Đây là phần lõi cung cấp các API để khởi tạo trình duyệt, mở trang web, tìm và tương tác với các phần tử trên trang (click, nhập liệu, kéo thả...), cũng như đọc trạng thái của trang. Thư viện này hỗ trợ ba dòng trình duyệt: Chromium, Firefox và WebKit thông qua một bộ API thống nhất.

**b) Playwright Test (Test Runner)**

Là bộ chạy kiểm thử (test runner) chính thức đi kèm Playwright. Nó cung cấp cấu trúc tổ chức test (`test`, `test.describe`, `beforeEach`...), cơ chế kiểm tra kết quả (`expect`), chạy test song song, thử lại test thất bại (retry), và xuất báo cáo. Đây là thành phần nhóm sử dụng để tổ chức 64 test cases.

**c) Locators (Bộ định vị phần tử)**

Cơ chế định vị phần tử thông minh của Playwright. Locator cho phép tìm phần tử theo nhiều cách: theo `data-testid`, theo text, theo vai trò (role), theo CSS selector hoặc XPath. Trong dự án, nhóm chủ yếu sử dụng thuộc tính `data-testid` (ví dụ: `[data-testid="search-input"]`) để định vị phần tử một cách ổn định, không phụ thuộc vào thay đổi giao diện.

**d) Auto-waiting (Cơ chế tự động chờ)**

Trước khi thực hiện một thao tác, Playwright tự động chờ phần tử ở trạng thái sẵn sàng (hiển thị, ổn định, có thể tương tác). Cơ chế này giúp loại bỏ phần lớn các lỗi do tải trang chậm hoặc nội dung động.

**e) Trace Viewer & Reporter (Công cụ gỡ lỗi và báo cáo)**

Playwright cung cấp công cụ ghi lại toàn bộ quá trình thực thi (trace), tự động chụp ảnh màn hình khi test thất bại (screenshot on failure) và xuất báo cáo trực quan giúp phân tích nguyên nhân lỗi.

📷 [HÌNH 1.2: Minh họa các thành phần / kiến trúc của Playwright]

### 1.1.3 Đặc điểm của Playwright

- **Đa trình duyệt:** Hỗ trợ Chromium, Firefox và WebKit chỉ với một bộ mã nguồn duy nhất.
- **Đa nền tảng:** Chạy được trên Windows, macOS và Linux, hỗ trợ chạy trong môi trường CI/CD và Docker.
- **Đa ngôn ngữ:** Hỗ trợ JavaScript/TypeScript, Python, Java, C#.
- **Tự động chờ (Auto-wait):** Giảm thiểu test chập chờn, tăng độ tin cậy.
- **Cô lập trạng thái:** Mỗi test có thể chạy trong một ngữ cảnh trình duyệt độc lập (browser context), không ảnh hưởng lẫn nhau.
- **Kiểm thử cả API và UI:** Playwright có thể gửi request HTTP trực tiếp (qua `request`) để chuẩn bị/khôi phục dữ liệu, kết hợp với kiểm thử giao diện.
- **Hỗ trợ headless và headed:** Có thể chạy ẩn (headless) để tăng tốc, hoặc hiển thị trình duyệt (headed) để quan sát.

## 1.2 Các tính năng chính của Playwright

### 1.2.1 Các tính năng chính

- **Tự động hóa trình duyệt:** Điều khiển trình duyệt thực hiện các thao tác như nhập liệu, click, cuộn trang, kéo thả, tải tệp...
- **Kiểm thử chức năng (Functional Testing):** Kiểm tra hành vi của các nút, biểu mẫu, modal, điều hướng trang... có hoạt động đúng đặc tả hay không.
- **Kiểm thử giao diện (UI Testing):** Kiểm tra việc hiển thị, trạng thái active/disable của các phần tử, thông báo lỗi...
- **Kiểm thử API:** Gửi request trực tiếp tới backend (ví dụ gọi `/api/reset` để khôi phục dữ liệu trước mỗi test) mà không cần thông qua giao diện.
- **Network Interception:** Theo dõi và can thiệp vào các request mạng, chờ phản hồi với mã trạng thái cụ thể (ví dụ chờ phản hồi HTTP 500).
- **Chụp ảnh & quay trace:** Tự động lưu bằng chứng khi test thất bại để phục vụ phân tích lỗi.
- **Chạy song song & lập lịch:** Chạy nhiều test cùng lúc hoặc tuần tự tùy cấu hình.

### 1.2.2 Ưu điểm

- **Tốc độ nhanh và ổn định:** Giao tiếp trực tiếp với trình duyệt, cơ chế auto-wait giúp test ít lỗi giả.
- **Đa trình duyệt thực sự:** Một bộ test chạy được trên cả Chromium, Firefox, WebKit.
- **Dễ tích hợp CI/CD:** Hỗ trợ tốt cho việc tự động chạy test khi build, deploy.
- **Công cụ gỡ lỗi mạnh mẽ:** Trace Viewer, screenshot, video giúp tìm nguyên nhân lỗi nhanh chóng.
- **Cộng đồng và tài liệu phong phú:** Được Microsoft hỗ trợ, tài liệu chính thức đầy đủ.
- **Kết hợp linh hoạt UI và API:** Cho phép thiết lập trạng thái dữ liệu nhanh chóng qua API.

### 1.2.3 Nhược điểm

- **Đòi hỏi kỹ năng lập trình:** Khác với công cụ ghi/phát (record & playback), Playwright yêu cầu người dùng biết lập trình để viết kịch bản hiệu quả.
- **Là công cụ mới:** Ra đời sau nên hệ sinh thái plugin của bên thứ ba chưa đồ sộ bằng một số công cụ lâu đời.
- **Không kiểm tra được mọi loại lỗi:** Cũng như các công cụ kiểm thử tự động khác, Playwright khó phát hiện các lỗi liên quan đến cảm nhận thị giác, hiệu năng sâu hoặc trải nghiệm chủ quan của người dùng.
- **Phụ thuộc bản cài trình duyệt:** Cần tải bản trình duyệt do Playwright quản lý (`npx playwright install`).

## 1.3 Quy trình làm việc với Playwright

Quy trình kiểm thử với Playwright trong đề tài gồm các bước sau:

1. **Phân tích yêu cầu và thiết kế ca kiểm thử:** Xác định các chức năng cần kiểm thử, định nghĩa dữ liệu đầu vào, kết quả mong đợi cho từng test case.
2. **Thiết lập môi trường kiểm thử:** Cài đặt Node.js, Playwright và trình duyệt; khởi chạy Backend (Go) và Frontend (React).
3. **Viết mã kiểm thử:** Dùng JavaScript viết các kịch bản test, sử dụng `locator` để định vị phần tử và `expect` để kiểm tra kết quả.
4. **Khôi phục trạng thái dữ liệu:** Trước mỗi test, gọi API `/api/reset` để đưa cơ sở dữ liệu về trạng thái ban đầu, đảm bảo các test độc lập với nhau.
5. **Thực thi kiểm thử:** Chạy lệnh `npx playwright test` để thực thi toàn bộ kịch bản.
6. **Ghi nhận và phân tích kết quả:** Xem kết quả Pass/Fail, ảnh chụp màn hình của các test thất bại và phân tích nguyên nhân.
7. **Báo cáo kết quả:** Tổng hợp tỉ lệ pass/fail, lập danh sách lỗi, đề xuất hướng khắc phục cho đội phát triển.

📷 [HÌNH 1.3: Sơ đồ quy trình làm việc với Playwright]

## 1.4 So sánh các công cụ kiểm thử tự động

**Bảng 1.1 So sánh các công cụ kiểm thử tự động**

| Tiêu chí | Playwright | Selenium | Cypress |
|---|---|---|---|
| Nhà phát triển | Microsoft | Cộng đồng / SeleniumHQ | Cypress.io |
| Trình duyệt hỗ trợ | Chromium, Firefox, WebKit | Chrome, Firefox, Edge, Safari, IE | Chromium, Firefox, Edge (WebKit hạn chế) |
| Ngôn ngữ lập trình | JS/TS, Python, Java, C# | Java, C#, Python, Ruby, JS... | Chỉ JavaScript/TypeScript |
| Cơ chế chờ phần tử | Tự động (auto-wait) | Phải tự cấu hình wait | Tự động |
| Tốc độ thực thi | Rất nhanh | Trung bình | Nhanh |
| Kiểm thử đa tab/đa cửa sổ | Hỗ trợ tốt | Có | Hạn chế |
| Kiểm thử API tích hợp | Có | Không (cần thư viện ngoài) | Có |
| Độ ổn định (ít flaky) | Cao | Phụ thuộc cấu hình | Cao |
| Công cụ gỡ lỗi | Trace Viewer, screenshot, video | Hạn chế | Time-travel, screenshot |
| Năm ra mắt | 2020 | 2004 | 2017 |

**Nhận xét:** Nhóm lựa chọn Playwright vì nó cân bằng tốt giữa tốc độ, độ ổn định và khả năng kiểm thử cả UI lẫn API. Đặc biệt, cơ chế gọi API `/api/reset` để cô lập trạng thái cơ sở dữ liệu trước mỗi test là một lợi thế lớn của Playwright so với các công cụ chỉ thuần kiểm thử giao diện.

---

# CHƯƠNG 2. XÂY DỰNG KẾ HOẠCH KIỂM THỬ

## 2.1 Giới thiệu

### 2.1.1 Mục đích

Mục đích của việc kiểm thử các chức năng website TECHACADEMY bằng Playwright bao gồm:

- **Đảm bảo tính ổn định và đáng tin cậy:** Xác nhận các chức năng hoạt động đúng như đặc tả, không phát sinh lỗi ngoài ý muốn.
- **Phát hiện lỗi sớm:** Tìm ra các lỗi chức năng, lỗi biên (boundary), lỗi bảo mật ngay trong quá trình phát triển.
- **Tối ưu hóa thời gian kiểm thử:** Tự động hóa giúp chạy lại toàn bộ 64 ca kiểm thử nhanh chóng sau mỗi lần thay đổi mã nguồn.
- **Tiết kiệm chi phí:** Giảm công sức kiểm thử thủ công lặp đi lặp lại.
- **Tăng độ chính xác:** Loại bỏ sai sót do con người, đảm bảo kết quả kiểm thử nhất quán.

### 2.1.2 Tổng quan về website

Website **Học Viện Công Nghệ TECHACADEMY** (https://khoahoc.phongngohong.online) là một nền tảng học trực tuyến (e-learning) cho phép người dùng tìm kiếm, đánh giá, đăng ký và quản lý các khóa học lập trình. Hệ thống được xây dựng theo kiến trúc tách biệt Frontend - Backend:

- **Frontend:** ReactJS (Vite) + CSS thuần, giao diện tối (dark mode) hiện đại, responsive.
- **Backend:** Golang, cung cấp các REST API.
- **Cơ sở dữ liệu:** SQLite, tự động khởi tạo và nạp dữ liệu mẫu (seed).
- **Triển khai:** Đóng gói bằng Docker, Docker Compose và Nginx trên máy ảo Google Cloud Platform.

Hệ thống được nạp sẵn **6 khóa học mẫu** thuộc 3 danh mục (Go, Frontend, DevOps), bao gồm cả khóa miễn phí và khóa có phí:

| STT | Tên khóa học | Giảng viên | Danh mục | Học phí (USD) |
|---|---|---|---|---|
| 1 | Golang Cơ Bản Cho Người Mới Bắt Đầu | Nguyễn Văn A | Go | 0.00 (Miễn phí) |
| 2 | Lập trình Golang Nâng Cao & Microservices | Trần Thị B | Go | 49.99 |
| 3 | ReactJS Premium & Mastery | Phạm Văn C | Frontend | 29.99 |
| 4 | CSS & Design System Cho Lập Trình Viên | Lê Thị D | Frontend | 0.00 (Miễn phí) |
| 5 | Docker & Kubernetes Từ Zero Đến Hero | Hoàng Văn E | DevOps | 79.99 |
| 6 | Xây Dựng SaaS Fullstack Với Next.js 14 | Vũ Thị F | Frontend | 59.99 |

📷 [HÌNH 2.1: Giao diện trang chủ website TECHACADEMY hiển thị danh sách khóa học]

### 2.1.3 Phạm vi

Tài liệu kế hoạch kiểm thử này áp dụng cho việc kiểm thử các chức năng của website TECHACADEMY trong khuôn khổ bài tập lớn môn Kiểm thử phần mềm. Nhóm thực hiện kiểm thử **4 nhóm chức năng** chính:

1. Tìm kiếm & Lọc khóa học
2. Đánh giá khóa học (Review)
3. Đăng ký học & Thanh toán
4. Danh sách yêu thích (Wishlist)

### 2.1.4 Những người sử dụng tài liệu này

- **Nhà phát triển phần mềm:** Sử dụng để hiểu yêu cầu và khắc phục các lỗi được báo cáo.
- **Kiểm thử viên:** Sử dụng để hiểu phạm vi, kịch bản và thực thi kiểm thử.
- **Quản lý dự án:** Theo dõi tiến độ và đảm bảo chất lượng.
- **Giảng viên hướng dẫn:** Đánh giá quy trình và kết quả kiểm thử của nhóm.

## 2.2 Lịch trình công việc

**Bảng 2.1 Lịch trình công việc**

| Milestone | Sản phẩm bàn giao | Thời lượng | Ngày bắt đầu | Ngày kết thúc |
|---|---|---|---|---|
| Lập kế hoạch kiểm thử | Tài liệu Test Plan | 3 ngày | 01/05/2026 | 03/05/2026 |
| Xây dựng website (FE/BE/DB) | Mã nguồn ứng dụng | 7 ngày | 04/05/2026 | 10/05/2026 |
| Thiết kế các test case | Tài liệu Test Case | 5 ngày | 11/05/2026 | 15/05/2026 |
| Viết kịch bản Playwright | Mã nguồn test | 6 ngày | 16/05/2026 | 21/05/2026 |
| Thực thi & ghi nhận kết quả | Tài liệu kết quả test | 3 ngày | 22/05/2026 | 24/05/2026 |
| Viết báo cáo & tổng hợp | Báo cáo cuối cùng | 4 ngày | 25/05/2026 | 28/05/2026 |

> Ghi chú: Bạn có thể chỉnh lại mốc thời gian cho khớp với thực tế của nhóm.

## 2.3 Những yêu cầu về tài nguyên

### 2.3.1 Phần cứng

**Bảng 2.2 Phần cứng**

| Thành phần | Thông số |
|---|---|
| Máy tính | Máy tính cá nhân có kết nối Internet |
| CPU | Intel Core i5, 2.4 GHz trở lên |
| RAM | 8 GB trở lên |
| Ổ cứng | SSD 256 GB |
| Máy chủ triển khai | Google Cloud VM `e2-small` (2 vCPU, 2 GB RAM, 20 GB SSD) |

### 2.3.2 Phần mềm

**Bảng 2.3 Phần mềm**

| Phần mềm | Phiên bản |
|---|---|
| Hệ điều hành (phát triển) | Windows 11 |
| Hệ điều hành (máy chủ) | Ubuntu 24.04 LTS |
| Node.js | 18.x trở lên |
| Golang | 1.22 trở lên |
| Trình duyệt kiểm thử | Chromium (qua Playwright) |
| Docker / Docker Compose | Phiên bản mới nhất |

### 2.3.3 Công cụ kiểm thử

**Bảng 2.4 Công cụ kiểm thử**

| Công cụ | Phiên bản | Nhà cung cấp | Mô tả |
|---|---|---|---|
| Playwright | @playwright/test (mới nhất) | Microsoft | Framework viết và chạy các ca kiểm thử tự động |
| Chromium | Bản do Playwright quản lý | Google / Playwright | Trình duyệt dùng để thực thi kịch bản test |
| Node.js (npm) | 18.x+ | OpenJS Foundation | Môi trường chạy và quản lý gói cho Playwright |
| Visual Studio Code | Mới nhất | Microsoft | Trình soạn thảo mã nguồn test |
| Microsoft Excel | 2019/365 | Microsoft | Quản lý danh sách test case |

### 2.3.4 Môi trường kiểm thử

Việc kiểm thử được thực hiện trên máy tính cá nhân có kết nối Internet. Hệ thống được chạy ở môi trường cục bộ (local): Backend Go chạy trên cổng `8080`, Frontend React chạy trên cổng `3000` (proxy các request `/api` về backend). Playwright thực thi các kịch bản trên trình duyệt Chromium ở chế độ tuần tự (1 worker) để cô lập trạng thái cơ sở dữ liệu giữa các test. Trước mỗi test, hệ thống tự động gọi API `/api/reset` nhằm đưa dữ liệu về trạng thái ban đầu.

## 2.4 Nhân sự

**Bảng 2.5 Nhân sự**

| Thành viên | Vai trò & Nhiệm vụ |
|---|---|
| [Họ tên thành viên 1] | Test Manager / Developer: Xây dựng Backend Go & cơ sở dữ liệu, lập kế hoạch kiểm thử, quản lý tiến độ, thực thi test chức năng Đăng ký & Thanh toán. |
| [Họ tên thành viên 2] | Developer / Tester: Xây dựng Frontend React, thiết kế và viết test case cho chức năng Tìm kiếm & Đánh giá. |
| [Họ tên thành viên 3] | Test Designer / Tester: Thiết kế test case Wishlist, viết kịch bản Playwright, tổng hợp kết quả và viết tài liệu báo cáo. |

> Ghi chú: Bạn điền tên thật của các thành viên trong nhóm.

## 2.5 Phạm vi kiểm thử

### 2.5.1 Những chức năng được kiểm thử

**a) Tìm kiếm & Lọc khóa học (10 test cases):**
- Tìm kiếm theo từ khóa chính xác, không phân biệt hoa/thường, có/không dấu tiếng Việt.
- Tìm kiếm với từ khóa không tồn tại, để trống, chỉ chứa khoảng trắng.
- Kiểm thử bảo mật trước tấn công SQL Injection.
- Lọc theo danh mục, lọc theo mức học phí (miễn phí/có phí), lọc kết hợp.
- Kiểm thử biên với từ khóa cực dài (> 200 ký tự).

**b) Đánh giá khóa học (16 test cases):**
- Gửi đánh giá (chọn sao + bình luận), kiểm tra ràng buộc khi chưa đăng nhập.
- Kiểm tra ràng buộc dữ liệu: số sao bằng 0, bình luận trống/quá ngắn/quá dài.
- Chống đánh giá trùng lặp, hiển thị điểm trung bình, hiển thị đánh giá tức thời.
- Kiểm thử bảo mật: SQL Injection và XSS trong nội dung bình luận.
- Kiểm thử ký tự đặc biệt / emoji.

**c) Đăng ký học & Thanh toán (22 test cases):**
- Đăng ký khóa miễn phí/có phí, đăng ký khi chưa đăng nhập, chống đăng ký trùng.
- Hủy đăng ký, đồng bộ "Khóa học của tôi", giới hạn số lượng học viên.
- Áp dụng mã giảm giá (GIAM20, GIAM50, FREE100), mã hết hạn, mã không hợp lệ.
- Hủy thanh toán, điều hướng học tập, đăng ký nhiều khóa.
- Kiểm tra làm tròn số tiền và trạng thái khóa chờ thanh toán.

**d) Danh sách yêu thích - Wishlist (16 test cases):**
- Thêm/xóa khóa học yêu thích, yêu cầu đăng nhập, trạng thái rỗng.
- Hiển thị trong tab Yêu thích, đăng ký trực tiếp từ tab này.
- Đồng bộ trạng thái giữa các tab, badge đếm số lượng.
- Cô lập wishlist giữa các tài khoản, giữ trạng thái khi điều hướng.

### 2.5.2 Những chức năng không được kiểm thử

- Chức năng quản trị nâng cao (Admin Dashboard CRUD).
- Tải lên/phát video bài học, nội dung học tập chi tiết.
- Kiểm thử UI/UX (bố cục, màu sắc, cảm nhận thị giác).
- Kiểm thử hiệu năng/tải (performance/load testing).
- Tích hợp cổng thanh toán thật.

## 2.6 Chiến lược kiểm thử

**Bảng 2.6 Kiểm thử chức năng**

| Hạng mục | Nội dung |
|---|---|
| Mục đích kiểm tra | Đảm bảo các chức năng hoạt động chính xác theo đặc tả yêu cầu. |
| Kỹ thuật | Thực thi các trường hợp với cả dữ liệu hợp lệ và không hợp lệ để xác định: kết quả mong đợi khi dữ liệu hợp lệ; cảnh báo/lỗi phù hợp khi dữ liệu không hợp lệ. |
| Tiêu chuẩn dừng | Tất cả test case đã thiết kế đều được thực thi; mọi lỗi tìm thấy đều được ghi nhận rõ ràng để hỗ trợ lập trình viên khắc phục. |
| Chịu trách nhiệm | Test Designer / Tester |
| Cách kiểm thử | Kiểm thử tự động bằng công cụ Playwright (JavaScript). |
| Xử lý ngoại lệ | Ghi nhận và mô tả tất cả vấn đề phát sinh trong quá trình thực thi (kèm ảnh chụp màn hình tự động). |

## 2.7 Điều kiện chấp nhận

- Tất cả các test case đã định nghĩa đều được thực thi và cho kết quả đúng như mong đợi (ngoại trừ các test case có lỗi cố ý để minh họa).
- Hệ thống chạy ổn định trên trình duyệt Chromium.
- Mọi lỗi được ghi nhận đầy đủ cùng nguyên nhân và mức độ nghiêm trọng.

## 2.8 Defect Tracking (Quản lý lỗi)

### 2.8.1 Phân loại lỗi

**Bảng 2.7 Phân loại lỗi**

| Mức độ nghiêm trọng | Đặc tả lỗi |
|---|---|
| High | Không thể tìm kiếm; không thể đăng ký khóa học; hệ thống trả về lỗi HTTP 500; lỗ hổng bảo mật (XSS) cho phép thực thi mã độc. |
| Medium | Tìm kiếm/lọc trả về sai kết quả; tạo bản ghi trùng lặp (race condition); khóa học bị ẩn sai khỏi danh sách của người dùng. |
| Low | Hiển thị số liệu không đúng định dạng (số tiền/điểm trung bình không làm tròn); một số chi tiết giao diện chưa nhất quán. |

### 2.8.2 Quy trình xử lý lỗi

**Bảng 2.8 Quy trình xử lý lỗi**

| Mức độ | Hướng xử lý |
|---|---|
| High | Cần khắc phục càng sớm càng tốt vì ảnh hưởng nghiêm trọng đến hệ thống; người dùng không thể sử dụng cho đến khi lỗi được sửa. |
| Medium | Nên được giải quyết trong quá trình phát triển bình thường; có thể chờ đến phiên bản kế tiếp. |
| Low | Gây khó chịu cho người dùng nhưng có thể sửa sau khi đã xử lý các lỗi nghiêm trọng hơn. |

Sau khi ghi nhận, các lỗi được tổng hợp và báo cáo cho đội phát triển để khắc phục.

---

# CHƯƠNG 3. TIẾN HÀNH CÀI ĐẶT VÀ DEMO THỰC NGHIỆM VỚI CÔNG CỤ PLAYWRIGHT

## 3.1 Cài đặt cấu hình

Playwright là một thư viện kiểm thử tự động chạy trên nền tảng Node.js. Để cài đặt và cấu hình môi trường kiểm thử, nhóm đã thực hiện các bước sau:

**Bước 1: Cài đặt Node.js**

Playwright yêu cầu môi trường Node.js (phiên bản 18 trở lên). Nhóm tải và cài đặt Node.js từ trang chủ chính thức (https://nodejs.org). Sau khi cài đặt, kiểm tra bằng lệnh `node -v` và `npm -v`.

📷 [HÌNH 3.1: Kiểm tra phiên bản Node.js và npm]

**Bước 2: Khởi tạo dự án test và cài đặt Playwright**

Trong thư mục `test/` của dự án, nhóm cài đặt Playwright bằng lệnh:

```bash
cd test
npm install
npx playwright install chromium
```

Lệnh `npm install` cài đặt thư viện `@playwright/test`, lệnh `npx playwright install chromium` tải về trình duyệt Chromium do Playwright quản lý.

📷 [HÌNH 3.2: Quá trình cài đặt Playwright và tải trình duyệt Chromium]

**Bước 3: Cấu hình Playwright**

Tệp cấu hình `playwright.config.js` định nghĩa các thiết lập chạy test:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,   // chạy tuần tự
  workers: 1,             // 1 luồng để cô lập trạng thái DB
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',  // tự chụp ảnh khi test fail
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Các thiết lập quan trọng:
- `workers: 1` và `fullyParallel: false`: chạy test tuần tự, tránh xung đột dữ liệu trên cơ sở dữ liệu SQLite dùng chung.
- `screenshot: 'only-on-failure'`: tự động chụp màn hình mỗi khi một test thất bại.
- `baseURL`: địa chỉ gốc của ứng dụng đang chạy.

📷 [HÌNH 3.3: Nội dung tệp cấu hình playwright.config.js]

## 3.2 Một số chức năng/cú pháp chính trong Playwright

Khi viết kịch bản kiểm thử, nhóm sử dụng các thành phần cú pháp cốt lõi sau:

- `test.describe('Tên nhóm', () => {...})`: nhóm các test case cùng chức năng.
- `test('Tên test', async ({ page }) => {...})`: định nghĩa một ca kiểm thử.
- `test.beforeEach(...)`: khối lệnh chạy trước mỗi test (dùng để reset dữ liệu).
- `page.goto('/')`: mở một trang web.
- `page.locator('[data-testid="..."]')`: định vị phần tử trên trang.
- `.fill('giá trị')`, `.click()`: thao tác nhập liệu, nhấp chuột.
- `expect(...).toHaveCount(n)`, `.toBeVisible()`, `.toContainText('...')`: kiểm tra kết quả mong đợi.
- `page.waitForResponse(...)`: chờ phản hồi mạng từ server (ví dụ chờ mã 500).
- `request.post('.../api/reset')`: gửi request API để khôi phục dữ liệu.

📷 [HÌNH 3.4: Cấu trúc thư mục test với 4 file kịch bản (search, review, register, wishlist)]

## 3.3 Cách viết một kịch bản kiểm thử với Playwright

Nhóm minh họa cách xây dựng một kịch bản kiểm thử thông qua chức năng **Tìm kiếm khóa học**.

**Kịch bản (TC-01): Tìm kiếm với từ khóa chính xác**
- Bước 1: Reset dữ liệu về trạng thái ban đầu (qua API `/api/reset`).
- Bước 2: Mở trang chủ website.
- Bước 3: Nhập từ khóa "Cơ Bản" vào ô tìm kiếm.
- Bước 4: Kiểm tra hệ thống hiển thị đúng 1 khóa học và chứa tên "Golang Cơ Bản".

Đoạn mã kịch bản tương ứng:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature 1: Course Search & Filters', () => {

  test.beforeEach(async ({ page, request }) => {
    // Khôi phục trạng thái database trước mỗi test
    const resetRes = await request.post('https://khoahoc.phongngohong.online/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    await page.goto('/');  // mở trang chủ
  });

  // TC-01: Tìm kiếm với từ khóa chính xác
  test('TC-01: Search with accurate keyword', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Cơ Bản');                 // nhập từ khóa

    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(1);                // mong đợi 1 kết quả
    await expect(cards.first()).toContainText('Golang Cơ Bản');
  });
});
```

📷 [HÌNH 3.5: Đoạn mã kịch bản test TC-01 trong VS Code]

📷 [HÌNH 3.6: Giao diện ô tìm kiếm trên website khi nhập từ khóa "Cơ Bản"]

## 3.4 Thực thi và xem kết quả kiểm thử

**Bước 1: Khởi chạy Backend và Frontend**

```bash
# Terminal 1 - Backend
cd backend
go run main.go

# Terminal 2 - Frontend
cd frontend
npm run dev
```

📷 [HÌNH 3.7: Backend Go khởi chạy thành công trên cổng 8080]

**Bước 2: Chạy toàn bộ test**

```bash
cd test
npx playwright test
```

Playwright lần lượt thực thi 64 test case. Với mỗi test thành công sẽ hiển thị dấu ✓ (màu xanh), test thất bại hiển thị dấu ✘ (màu đỏ) kèm thông tin lỗi.

📷 [HÌNH 3.8: Kết quả chạy test trên terminal — các test case PASS (màu xanh)]

📷 [HÌNH 3.9: Kết quả các test case FAIL (màu đỏ) với thông tin lỗi]

**Bước 3: Xem ảnh chụp màn hình khi test thất bại**

Khi một test thất bại, Playwright tự động lưu ảnh chụp màn hình vào thư mục `test-results/`. Ảnh này giúp phân tích chính xác trạng thái giao diện tại thời điểm xảy ra lỗi.

📷 [HÌNH 3.10: Ảnh chụp màn hình tự động của một test case FAIL trong thư mục test-results]

**Bước 4: Chạy một file/test cụ thể (tùy chọn)**

```bash
npx playwright test search.spec.js        # chạy riêng nhóm Tìm kiếm
npx playwright test -g "TC-01"            # chạy riêng test theo tên
npx playwright test --headed              # chạy có hiển thị trình duyệt
```

Chi tiết toàn bộ các ca kiểm thử và kết quả được trình bày tại **PHỤ LỤC** của báo cáo này.

---

# CHƯƠNG 4. KẾT LUẬN

## 4.1 Kết quả đạt được

- Trình bày được tổng quan về kiểm thử phần mềm và kiểm thử tự động ứng dụng web.
- Giới thiệu chi tiết công cụ kiểm thử tự động hiện đại **Playwright**: thành phần, tính năng, ưu/nhược điểm và quy trình làm việc.
- Xây dựng hoàn chỉnh một website học trực tuyến (TECHACADEMY) theo kiến trúc Fullstack: React (Frontend) + Golang (Backend) + SQLite (Database), triển khai bằng Docker/Nginx.
- Thiết kế và thực thi thành công **64 ca kiểm thử tự động** cho 4 nhóm chức năng: Tìm kiếm & Lọc, Đánh giá, Đăng ký & Thanh toán, Danh sách yêu thích.
- Phát hiện và minh họa được **8 lỗi cố ý** mang tính thực tế (lỗi biên, race condition, lỗ hổng XSS, lỗi logic bộ lọc, lỗi làm tròn số, lỗi ẩn dữ liệu) — chứng minh khả năng phát hiện lỗi hiệu quả của kiểm thử tự động.
- Báo cáo là tài liệu súc tích, tổng hợp các vấn đề chính của kiểm thử phần mềm và có thể dùng làm tài liệu tham khảo ngắn gọn về Playwright bằng tiếng Việt.

## 4.2 Hạn chế

- Mới chỉ kiểm thử 4 nhóm chức năng cốt lõi, chưa bao phủ toàn bộ hệ thống (đặc biệt là phần quản trị Admin).
- Chưa thực hiện kiểm thử hiệu năng (performance) và kiểm thử tải (load testing).
- Chưa khai thác hết các tính năng nâng cao của Playwright như chạy đa trình duyệt song song, kiểm thử trực quan (visual testing), tích hợp CI/CD đầy đủ.
- Kiến thức và kinh nghiệm còn hạn chế nên báo cáo khó tránh khỏi thiếu sót.

## 4.3 Hướng phát triển đề tài

- Mở rộng phạm vi kiểm thử cho toàn bộ chức năng của hệ thống, bao gồm phần quản trị.
- Tích hợp bộ test vào quy trình CI/CD (ví dụ GitHub Actions) để tự động chạy test mỗi khi có thay đổi mã nguồn.
- Nghiên cứu kiểm thử đa trình duyệt (Firefox, WebKit) và kiểm thử trên thiết bị di động.
- Áp dụng kiểm thử trực quan (visual regression) và kiểm thử hiệu năng để nâng cao chất lượng toàn diện.
- Vận dụng kiến thức vào kiểm thử các dự án lớn hơn trong thực tế.

---

# TÀI LIỆU THAM KHẢO

1. Playwright Documentation — https://playwright.dev/docs/intro
2. Playwright Test API — https://playwright.dev/docs/api/class-test
3. Node.js Documentation — https://nodejs.org/en/docs
4. The Go Programming Language — https://go.dev/doc/
5. SQLite Documentation — https://www.sqlite.org/docs.html
6. React Documentation — https://react.dev/
7. OWASP — SQL Injection & XSS — https://owasp.org/

---

# PHỤ LỤC 1: Tổng hợp kết quả kiểm thử

**Bảng tổng hợp kết quả thực thi 64 test case:**

| Chức năng | Số TC đạt (Pass) | Số TC không đạt (Fail) | Tổng số TC | Tỉ lệ đạt |
|---|---|---|---|---|
| Tìm kiếm & Lọc khóa học | 8 | 2 | 10 | 80.00% |
| Đánh giá khóa học | 13 | 3 | 16 | 81.25% |
| Đăng ký & Thanh toán | 20 | 2 | 22 | 90.91% |
| Danh sách yêu thích (Wishlist) | 15 | 1 | 16 | 93.75% |
| **TỔNG CỘNG** | **56** | **8** | **64** | **87.50%** |

**Danh sách 8 test case FAIL (lỗi cố ý) và phân tích nguyên nhân:**

| Test Case | Chức năng | Mô tả lỗi | Mức độ |
|---|---|---|---|
| TC-09 | Tìm kiếm | Frontend không giới hạn độ dài từ khóa; backend nhận chuỗi > 200 ký tự trả về lỗi HTTP 500 thay vì thông báo thân thiện. | High |
| TC-61 | Tìm kiếm/Lọc | Backend dùng `else-if` giữa điều kiện danh mục và giá nên khi đã chọn danh mục thì bỏ qua bộ lọc giá → trả về 2 khóa thay vì 1. | Medium |
| TC-23 | Đánh giá | Frontend không disable nút Gửi, backend ghi dữ liệu có độ trễ → Race condition tạo 2 đánh giá trùng của cùng 1 người. | Medium |
| TC-24 | Đánh giá | Hiển thị bình luận qua `dangerouslySetInnerHTML` không lọc HTML → lỗ hổng XSS, mã script độc hại được thực thi. | High |
| TC-62 | Đánh giá | Trang chi tiết quên gọi `.toFixed(1)` → điểm trung bình hiển thị `3.3333333333333335` thay vì `3.3`. | Low |
| TC-63 | Đăng ký | Backend tính `49.99 * 0.8` bằng float, trả về `39.992000000000004` không làm tròn → hiển thị số tiền sai. | Low |
| TC-64 | Đăng ký | API `/api/my-courses` chỉ lọc `status='completed'` → khóa trả phí đang chờ thanh toán bị ẩn khỏi "Khóa học của tôi". | Medium |
| TC-59 | Wishlist | Frontend không debounce nút yêu thích; backend lỗi xung đột UNIQUE constraint của SQLite → trả về HTTP 500. | High |

> Nhận xét: 56/64 test case đạt (87.5%). 8 test case không đạt đều là lỗi được cài đặt cố ý để minh họa năng lực phát hiện lỗi của bộ kiểm thử tự động Playwright, bao gồm các loại lỗi đa dạng: lỗi biên, lỗi logic, race condition, lỗ hổng bảo mật và lỗi định dạng dữ liệu.

📷 [HÌNH PL.1: Bảng tổng kết kết quả chạy 64 test trên terminal — 56 passed, 8 failed]

---

# PHỤ LỤC 2: Các ca kiểm thử chức năng Tìm kiếm & Lọc khóa học

| STT | Test Case ID | Mô tả | Input | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|---|
| 1 | TC-01 | Tìm kiếm với từ khóa chính xác | "Cơ Bản" | Hiển thị đúng 1 khóa "Golang Cơ Bản" | Pass |
| 2 | TC-02 | Tìm kiếm không phân biệt hoa/thường | "golang" và "GOLANG" | Hai lần cho cùng số kết quả (2 khóa) | Pass |
| 3 | TC-03 | Tìm kiếm từ khóa không tồn tại | "Python Django Machine Learning" | Hiện "Không tìm thấy khóa học nào phù hợp" | Pass |
| 4 | TC-04 | Để trống ô tìm kiếm | "" | Hiển thị đủ 6 khóa học ban đầu | Pass |
| 5 | TC-05 | Tìm kiếm chỉ chứa khoảng trắng | "   " | Xử lý an toàn, hiện thông báo không tìm thấy | Pass |
| 6 | TC-06 | Kiểm thử SQL Injection | `' OR '1'='1`, `'; DROP TABLE reviews; --`... | Xử lý an toàn, không crash, không lộ dữ liệu | Pass |
| 7 | TC-07 | Lọc theo danh mục | Chọn danh mục "Go" | Hiển thị đúng 2 khóa thuộc Go | Pass |
| 8 | TC-08 | Lọc theo mức học phí | Chọn "Miễn phí" / "Có phí" | Miễn phí: 2 khóa; Có phí: 4 khóa | Pass |
| 9 | TC-09 | Tìm kiếm từ khóa cực dài (>200 ký tự) | Chuỗi 210 ký tự "A" | Báo lỗi thân thiện (không 500) | **Fail** |
| 10 | TC-61 | Lọc kết hợp danh mục + giá | "Go" + "Có phí" | Hiển thị đúng 1 khóa (Go có phí) | **Fail** |

📷 [HÌNH PL.2: Một số ca kiểm thử chức năng Tìm kiếm trong mã nguồn / kết quả chạy]

---

# PHỤ LỤC 3: Các ca kiểm thử chức năng Đánh giá khóa học

| STT | Test Case ID | Mô tả | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|
| 1 | TC-10 | Gửi đánh giá đầy đủ (sao + bình luận) | Gửi thành công | Pass |
| 2 | TC-11 | Đánh giá khi chưa đăng nhập | Trường nhập & nút Gửi bị disable, có cảnh báo | Pass |
| 3 | TC-12 | Để trống bình luận, chỉ chọn sao | Cho phép gửi thành công | Pass |
| 4 | TC-13 | Đánh giá với số sao = 0 | API chặn, trả lỗi 400 | Pass |
| 5 | TC-14 | Bình luận chỉ chứa khoảng trắng | Trim & báo lỗi bình luận quá ngắn | Pass |
| 6 | TC-15 | Độ dài bình luận tối thiểu (<3 ký tự) | Báo lỗi | Pass |
| 7 | TC-16 | Độ dài bình luận tối đa (>500 ký tự) | Báo lỗi | Pass |
| 8 | TC-17 | Đánh giá hiện ngay đầu danh sách | Hiển thị tức thời | Pass |
| 9 | TC-18 | SQL Injection trong bình luận | Lưu trữ an toàn nội dung thô | Pass |
| 10 | TC-19 | Đánh giá nhiều lần cùng 1 khóa | Báo "Bạn đã đánh giá khóa học này rồi" | Pass |
| 11 | TC-20 | Điểm trung bình cập nhật chính xác | Cập nhật đúng | Pass |
| 12 | TC-21 | Khôi phục form khi đóng/mở lại modal | Reset comment & rating về mặc định | Pass |
| 13 | TC-22 | Đánh giá chứa ký tự đặc biệt / emoji | Lưu & hiển thị chính xác | Pass |
| 14 | TC-23 | Spam nút Gửi đánh giá liên tục | Chỉ tồn tại 1 đánh giá (không trùng) | **Fail** |
| 15 | TC-24 | Bình luận chứa mã XSS độc hại | Mã script bị vô hiệu hóa, không thực thi | **Fail** |
| 16 | TC-62 | Điểm trung bình ở trang chi tiết | Hiển thị làm tròn 1 chữ số (vd 3.3) | **Fail** |

📷 [HÌNH PL.3: Ảnh chụp test case XSS (TC-24) phát hiện lỗ hổng bảo mật]

---

# PHỤ LỤC 4: Các ca kiểm thử chức năng Đăng ký & Thanh toán

| STT | Test Case ID | Mô tả | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|
| 1 | TC-25 | Đăng ký khóa miễn phí | Bỏ qua thanh toán, badge "Đã đăng ký" | Pass |
| 2 | TC-26 | Đăng ký khóa có phí | Hiện modal thanh toán + QR, xác nhận OK | Pass |
| 3 | TC-27 | Đăng ký khi chưa đăng nhập | Hiện modal đăng nhập rồi tiếp tục | Pass |
| 4 | TC-28 | Đăng ký lặp lại cùng 1 khóa | API trả lỗi 400 | Pass |
| 5 | TC-29 | Đồng bộ "Khóa học của tôi" | Hiển thị đúng trong dashboard | Pass |
| 6 | TC-30 | Hủy đăng ký khóa học | Khóa biến mất khỏi dashboard | Pass |
| 7 | TC-31 | Giới hạn số học viên tối đa | Người vượt giới hạn bị báo đầy | Pass |
| 8 | TC-32 | Áp mã giảm giá 50% (GIAM50) | Giảm giá hiển thị đúng | Pass |
| 9 | TC-33 | Áp mã giảm giá 100% (FREE100) | Giá về $0.00 | Pass |
| 10 | TC-34 | Mã giảm giá hết hạn (EXPIRED) | Báo lỗi mã hết hạn | Pass |
| 11 | TC-35 | Mã giảm giá không hợp lệ | Báo lỗi mã không hợp lệ | Pass |
| 12 | TC-36 | Đổi mã giảm giá động khi thanh toán | Cập nhật đúng giá | Pass |
| 13 | TC-37 | Hủy thanh toán (click ngoài modal) | Đóng modal, giữ trạng thái chưa đăng ký | Pass |
| 14 | TC-38 | Hiển thị nút "Vào học ngay" | Hiện đúng cho khóa đã sở hữu | Pass |
| 15 | TC-39 | Click "Vào học ngay" | Mở Course Learning Hub | Pass |
| 16 | TC-40 | Điều hướng quay lại Explore | Trở về danh sách khóa học | Pass |
| 17 | TC-41 | Đăng ký nhiều khóa cùng lúc | Tất cả thành công | Pass |
| 18 | TC-42 | Hủy thanh toán khóa trả phí | Không ghi nhận đăng ký | Pass |
| 19 | TC-43 | Áp mã GIAM20 đồng bộ FE/BE | Đồng bộ đúng | Pass |
| 20 | TC-44 | FREE100 bỏ qua màn QR | Tự bỏ qua thanh toán | Pass |
| 21 | TC-63 | Làm tròn số tiền khi giảm giá | Hiển thị số tiền làm tròn 2 chữ số | **Fail** |
| 22 | TC-64 | Khóa "chờ thanh toán" trong dashboard | Hiển thị trong "Khóa học của tôi" | **Fail** |

📷 [HÌNH PL.4: Modal thanh toán và áp dụng mã giảm giá]

---

# PHỤ LỤC 5: Các ca kiểm thử chức năng Danh sách yêu thích (Wishlist)

| STT | Test Case ID | Mô tả | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|
| 1 | TC-45 | Thêm vào yêu thích khi đã đăng nhập | Trái tim chuyển đỏ/active | Pass |
| 2 | TC-46 | Thêm yêu thích khi chưa đăng nhập | Hiện modal đăng nhập | Pass |
| 3 | TC-47 | Xóa yêu thích từ trang chủ | Bỏ trạng thái đỏ | Pass |
| 4 | TC-48 | Trạng thái rỗng tab Yêu thích | Hiện thông báo trống | Pass |
| 5 | TC-49 | Khóa yêu thích xuất hiện trong tab | Hiển thị đúng | Pass |
| 6 | TC-50 | Xem chi tiết khóa trong tab Yêu thích | Hiển thị đúng thông tin | Pass |
| 7 | TC-51 | Đăng ký trực tiếp từ tab Yêu thích | Đăng ký thành công | Pass |
| 8 | TC-52 | Xóa khóa khỏi tab Yêu thích | Thẻ biến mất ngay | Pass |
| 9 | TC-53 | Đồng bộ trạng thái "Đã đăng ký" giữa các tab | Cập nhật cả 2 tab | Pass |
| 10 | TC-54 | Class CSS active của nút Trái tim | Hiển thị đúng | Pass |
| 11 | TC-55 | Đăng xuất xóa wishlist trên giao diện | Ẩn tab Yêu thích | Pass |
| 12 | TC-56 | Cô lập wishlist giữa các tài khoản | Mỗi user có wishlist riêng | Pass |
| 13 | TC-57 | Badge đếm số lượng yêu thích | Cập nhật động `Yêu thích (N)` | Pass |
| 14 | TC-58 | Khôi phục yêu thích khóa đã xóa | Thêm lại thành công | Pass |
| 15 | TC-60 | Giữ wishlist khi điều hướng giữa các tab | Vẫn còn yêu thích | Pass |
| 16 | TC-59 | Spam nút yêu thích liên tục | Xử lý ổn định, không lỗi 500 | **Fail** |

📷 [HÌNH PL.5: Tab "Yêu thích" và badge đếm số lượng khóa học]
