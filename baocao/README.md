# Thư mục `baocao/` — Tài liệu báo cáo & thuyết trình

Chứa toàn bộ tài liệu và **script sinh tài liệu** cho đồ án
*"Kiểm thử một số chức năng của trang web bằng công cụ Playwright"*.

> ⚠️ Các file `.docx / .xlsx / .pptx` đều là **file sinh ra tự động** và đã được
> `.gitignore` (xem `.gitignore` ở thư mục gốc). Muốn có lại chúng thì chạy script
> tương ứng bên dưới — **không cần** commit các file này lên git.

---

## 1. Nội dung thư mục

| File | Loại | Mô tả |
|------|------|-------|
| `BC-KIỂM THỬ.docx`              | 📄 Nguồn   | **Bản báo cáo hoàn chỉnh của nhóm** — nguồn gốc nội dung cho slide. |
| `noi_dung_bao_cao.md`           | 📝 Nguồn   | Bản Markdown của báo cáo, đầu vào cho `md_to_docx.py`. |
| `make_pptx.py`                  | 🐍 Script  | Sinh **bài thuyết trình PowerPoint** từ nội dung báo cáo. |
| `md_to_docx.py`                 | 🐍 Script  | Chuyển `noi_dung_bao_cao.md` → file Word `.docx`. |
| `gen_testcases.py`              | 🐍 Script  | Sinh bảng danh sách test case ra file Excel `.xlsx`. |
| `BaoCao_Playwright_Slide.pptx`  | 🎞️ Sinh ra | Slide thuyết trình (output của `make_pptx.py`). |
| `bao_cao_TECHACADEMY.docx`      | 📄 Sinh ra | Báo cáo Word (output của `md_to_docx.py`). |
| `Danh_sach_Test_Case_TECHACADEMY.xlsx` | 📊 Sinh ra | Danh sách test case (output của `gen_testcases.py`). |
| `bc.docx`                       | 📄 Cũ      | Bản báo cáo cũ (lưu trữ). |

---

## 2. Cách chạy lại các script

Cần Python 3 + các thư viện: `python-pptx`, `python-docx`, `openpyxl`.

```bash
pip install python-pptx python-docx openpyxl
```

**Quan trọng:** luôn chạy script **bên trong thư mục `baocao/`** vì các script
dùng đường dẫn tương đối (file đầu vào/đầu ra nằm cùng thư mục này).

```bash
cd baocao

python make_pptx.py     # -> BaoCao_Playwright_Slide.pptx (slide thuyết trình)
python md_to_docx.py    # -> bao_cao_TECHACADEMY.docx
python gen_testcases.py # -> Danh_sach_Test_Case_TECHACADEMY.xlsx
```

---

## 3. Về bài thuyết trình (`make_pptx.py` → 25 slide)

Bố cục slide:

1. Bìa → Nội dung → Đặt vấn đề
2. **Chương 1 (5 slide):** giới thiệu Playwright, thành phần, ưu/nhược điểm,
   quy trình, so sánh công cụ.
3. **Chương 2 (4 slide):** kế hoạch, phạm vi, lịch trình & nhân sự, chiến lược.
4. **Chương 3 (2 slide):** cách viết & thực thi kịch bản, kết quả 64 test case.
5. **Phân tích lỗi (1 + 8 slide):** 1 slide tổng quan + **mỗi lỗi 1 slide**
   (3 High → 3 Medium → 2 Low), theo bố cục: mức độ · kỹ thuật phát hiện ·
   hiện tượng · mong đợi vs thực tế · nguyên nhân.
6. Hạn chế & hướng phát triển → Cảm ơn.

### Slide cần chèn ảnh
Các slide này có sẵn **khung viền xanh "KHUNG CHÈN ẢNH"** kèm mô tả ảnh cần dán —
chỉ việc dán ảnh đè lên khung là xong:

- **Slide 4** — Logo / sơ đồ tổng quan Playwright.
- **Slide 9** — Giao diện trang chủ website thử nghiệm.
- **Slide 13** — Terminal kết quả chạy test (PASS/FAIL).
- **8 slide lỗi (16–23)** — mỗi slide có 1 khung nhỏ *tùy chọn* để dán ảnh minh
  họa lỗi (terminal / màn hình / Trace Viewer). Để trống vẫn đầy đủ nội dung.

### Muốn chỉnh nội dung slide
Sửa trực tiếp trong `make_pptx.py` rồi chạy lại. Một số chỗ hay sửa:
- Danh sách 8 lỗi: biến `bugs = [...]` (gần cuối file).
- Bảng kết quả 64 test case & màu sắc theme: phần đầu file (`PRIMARY`, `ACCENT`...).
- Văn bản từng chương: tìm theo comment `# CHƯƠNG 1`, `# CHƯƠNG 2`, ...
