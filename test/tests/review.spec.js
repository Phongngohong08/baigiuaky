import { test, expect } from '@playwright/test';

async function loginUser(page, email) {
  await page.locator('[data-testid="login-modal-trigger"]').click();
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="login-submit-btn"]').click();
  await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
}

test.describe('Feature 2: Course Reviews', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Reset database state before each test
    const resetRes = await request.post('http://127.0.0.1:8080/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    
    // Go to homepage
    await page.goto('/');
  });

  // TC-10: Kiểm tra tính năng gửi đánh giá thành công
  // Mục tiêu: Khi đăng nhập và điền đầy đủ thông tin (chọn 4 sao, ghi nội dung bình luận), bình luận mới phải hiển thị ngay trong danh sách đánh giá của khóa học.
  test('TC-10: Submit review successfully', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Open details of Course 1
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // Fill review form
    await page.locator('[data-testid="review-rating-4"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Khóa học rất bổ ích, tôi học được nhiều.');
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    // Verify success toast or text
    await expect(page.locator('[data-testid="review-success-message"]')).toContainText('Đánh giá của bạn đã được ghi nhận');
    
    // Verify review item appears in list
    const firstReview = page.locator('[data-testid="review-item"]').first();
    await expect(firstReview.locator('.review-user')).toContainText('student5@gmail.com');
    await expect(firstReview.locator('[data-testid="review-comment-text"]')).toContainText('Khóa học rất bổ ích');
  });

  // TC-11: Kiểm tra hành vi gửi đánh giá khi chưa đăng nhập
  // Mục tiêu: Nếu chưa đăng nhập, các trường nhập bình luận và nút Gửi đánh giá trong modal chi tiết khóa học phải bị disable (vô hiệu hóa) và hiện thông báo nhắc nhở.
  test('TC-11: Submit review when not logged in', async ({ page }) => {
    // Open details of Course 1 (not logged in)
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // Review form elements should display warning and be disabled
    await expect(page.locator('[data-testid="review-unauthorized-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-comment-input"]')).toBeDisabled();
    await expect(page.locator('[data-testid="review-submit-btn"]')).toBeDisabled();
  });

  // TC-12: Kiểm tra gửi đánh giá chỉ chọn số sao và để trống phần bình luận
  // Mục tiêu: Hệ thống vẫn chấp nhận cho phép gửi đánh giá thành công khi chỉ có xếp hạng sao mà không có bình luận chữ viết.
  test('TC-12: Submit review with empty comment but has stars', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill(''); // Empty comment
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-success-message"]')).toBeVisible();
  });

  // TC-13: Kiểm tra tính hợp lệ dữ liệu biên: Đánh giá với số sao bằng 0
  // Mục tiêu: API phải chặn các yêu cầu gửi đánh giá với số sao = 0 và trả về lỗi HTTP 400 cùng thông báo phù hợp.
  test('TC-13: Submit review with invalid stars (0 stars)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // We call the API directly using request to test boundary value 0 stars
    const res = await page.request.post('http://127.0.0.1:8080/api/courses/1/reviews', {
      headers: { 'X-User-Email': 'student5@gmail.com' },
      data: { rating: 0, comment: 'Không chọn sao nào' }
    });
    
    expect(res.status()).toBe(400);
    const text = await res.text();
    expect(text).toContain('Vui lòng chọn số sao từ 1 đến 5');
  });

  // TC-14: Kiểm tra tính hợp lệ dữ liệu biên: Bình luận chỉ chứa khoảng trắng (spaces)
  // Mục tiêu: Khi nhập bình luận chỉ gồm dấu cách ("   "), hệ thống phải tự động trim (loại bỏ) khoảng trắng và báo lỗi bình luận quá ngắn (< 3 ký tự).
  test('TC-14: Review comment only spaces is validated and trimmed', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-4"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('      '); // Spaces only
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    // Trimmed comment has length 0 which is < 3 characters, so it should throw error
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bình luận phải có ít nhất 3 ký tự');
  });

  // TC-15: Kiểm tra tính hợp lệ dữ liệu biên: Độ dài bình luận tối thiểu (< 3 ký tự)
  // Mục tiêu: Khi bình luận ngắn hơn 3 ký tự (VD: "Hi"), hệ thống phải chặn và báo lỗi "Bình luận phải có ít nhất 3 ký tự".
  test('TC-15: Review comment too short (< 3 characters)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Hi'); // 2 chars
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bình luận phải có ít nhất 3 ký tự');
  });

  // TC-16: Kiểm tra tính hợp lệ dữ liệu biên: Độ dài bình luận tối đa (> 500 ký tự)
  // Mục tiêu: Khi người dùng cố ý hoặc vô tình dán đoạn bình luận quá dài (> 500 ký tự), hệ thống chặn và báo lỗi tương ứng.
  test('TC-16: Review comment too long (> 500 characters)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    const longComment = 'A'.repeat(505);
    await page.locator('[data-testid="review-comment-input"]').fill(longComment);
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bình luận không được vượt quá 500 ký tự');
  });

  // TC-17: Kiểm tra thứ tự hiển thị đánh giá mới
  // Mục tiêu: Sau khi gửi thành công, đánh giá mới của người dùng phải hiển thị ngay lập tức ở đầu (trên cùng) danh sách bình luận (sắp xếp giảm dần theo ID/thời gian).
  test('TC-17: New review appears instantly at the top of reviews list', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Bình luận này sẽ ở trên đầu!');
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    // First review in the list should be the new one
    await page.waitForTimeout(200); // Wait for DOM updates
    const firstReviewText = await page.locator('[data-testid="review-comment-text"]').first().textContent();
    expect(firstReviewText).toBe('Bình luận này sẽ ở trên đầu!');
  });

  // TC-18: Kiểm thử độ an toàn bảo mật trước tấn công SQL Injection thông qua ô bình luận
  // Mục tiêu: Khi gửi nội dung bình luận chứa các câu lệnh SQL độc hại, cơ sở dữ liệu phải xử lý an toàn và lưu trữ nguyên vẹn nội dung đó dưới dạng text thô, không gây lỗi hệ thống.
  test('TC-18: SQL Injection payload in review comment is handled safely', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    const sqlPayload = "'; DROP TABLE courses; -- OR rating = 5";
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill(sqlPayload);
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-success-message"]')).toBeVisible();
    
    // Verify stored comment literally
    const firstReview = page.locator('[data-testid="review-item"]').first();
    await expect(firstReview.locator('[data-testid="review-comment-text"]')).toContainText(sqlPayload);
  });

  // TC-19: Chặn đánh giá nhiều lần từ một tài khoản trên một khóa học
  // Mục tiêu: Hệ thống chỉ cho phép mỗi tài khoản đánh giá duy nhất 1 lần cho 1 khóa học. Tài khoản `student1@gmail.com` đã đánh giá khóa học 1 trong seed data, nên gửi tiếp sẽ báo lỗi.
  test('TC-19: One account reviews multiple times throws error', async ({ page }) => {
    // student1@gmail.com has already reviewed course 1 (seeded in db)
    await loginUser(page, 'student1@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-comment-input"]').fill('Thêm đánh giá mới nữa...');
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bạn đã đánh giá khóa học này rồi');
  });

  // TC-20: Kiểm tra tính toán điểm đánh giá trung bình (Average Rating)
  // Mục tiêu: Điểm đánh giá trung bình và số lượng review của khóa học phải được cập nhật chính xác sau khi ghi nhận bình luận mới (VD: từ 4.5 xuống 3.3 khi thêm review 1 sao).
  test('TC-20: Average score updates accurately', async ({ page }) => {
    // Open course 1. Initial avg is (5+4)/2 = 4.5
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    await expect(page.locator('[data-testid="course-detail-price"]')).toBeVisible();
    
    await page.locator('[data-testid="close-modal-btn"]').click();
    
    // Add review of 1 star from student5@gmail.com. New avg should be (5+4+1)/3 = 3.3
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    await page.locator('[data-testid="review-rating-1"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Rất tệ, không đúng như quảng cáo');
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    // Modal updates
    await expect(page.locator('.modal-meta-row')).toContainText('3.3');
  });

  // TC-21: Khôi phục trạng thái form khi đóng mở lại modal chi tiết
  // Mục tiêu: Khi đóng modal chi tiết khi đang nhập dở review, rồi mở lại modal đó, nội dung bình luận cũ phải được xóa trống và số sao khôi phục về giá trị mặc định là 5.
  test('TC-21: Review state resets when close detail modal', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-2"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Đang nhập dở dang...');
    
    // Close modal
    await page.locator('[data-testid="close-modal-btn"]').click();
    
    // Open modal again
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // Input comment should be empty and rating reset to 5
    const commentInput = page.locator('[data-testid="review-comment-input"]');
    await expect(commentInput).toHaveValue('');
    const activeStar = page.locator('[data-testid="review-rating-5"]');
    await expect(activeStar).toHaveClass(/selected/);
  });

  // TC-22: Kiểm tra gửi đánh giá chứa ký tự đặc biệt / Emoji
  // Mục tiêu: Hệ thống phải hỗ trợ lưu trữ và hiển thị các icon emoji một cách chính xác trong bình luận của học viên.
  test('TC-22: Submit review with emoji in comment works', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    const emojiComment = 'Tuyệt vời quá! ⭐⭐⭐🚀🚀🚀';
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill(emojiComment);
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-success-message"]')).toBeVisible();
    
    const firstReview = page.locator('[data-testid="review-item"]').first();
    await expect(firstReview.locator('[data-testid="review-comment-text"]')).toContainText(emojiComment);
  });

  // TC-23 (LỖI CỐ Ý - FAILED): Chặn spam gửi bình luận bằng click chuột liên tục
  // Mục tiêu: Frontend phải khóa nút Gửi sau click đầu tiên để tránh gửi trùng lặp.
  // Ý đồ lỗi: Frontend bỏ quên vô hiệu hóa nút bấm và backend xử lý trễ (`150ms`) làm nảy sinh lỗi race condition chèn 2 bản ghi trùng lặp của cùng một user, khiến test case assert count = 1 bị FAILED.
  test('TC-23 (FAILED INTENTIONAL): Spam review submission clicks', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Đang spam bình luận nè!');
    
    // Click submit twice rapidly to ensure concurrency on the backend
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="review-submit-btn"]');
      if (btn) {
        btn.click();
        btn.click();
      }
    });
    
    await page.waitForTimeout(1000); // wait for both requests to finish
    
    // Due to the race condition bug, it creates 2 duplicate reviews in the database!
    // The test asserts that there is ONLY 1 review from student5, so this assertion will FAIL.
    const student5Reviews = page.locator('[data-testid="review-item"]', { hasText: 'student5@gmail.com' });
    await expect(student5Reviews).toHaveCount(1); // This will fail because count will be 2!
  });

  // TC-24 (LỖI CỐ Ý - FAILED): Chặn lỗ hổng bảo mật XSS (Cross-Site Scripting) thông qua bình luận
  // Mục tiêu: Hệ thống phải mã hóa/sanitize các thẻ HTML nguy hiểm trước khi hiển thị trên giao diện người dùng.
  // Ý đồ lỗi: Frontend hiển thị bình luận qua `dangerouslySetInnerHTML` để hỗ trợ `<br />` xuống dòng nhưng không lọc thẻ HTML độc hại, dẫn đến việc chèn và thực thi được đoạn script `<img onerror="..." />`, làm thay đổi biến toàn cục `window.xssDetected = true` khiến test case phát hiện ra lỗ hổng và FAILED.
  test('TC-24 (FAILED INTENTIONAL): HTML Injection/XSS in review comments', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // XSS payload
    const xssPayload = '<img src="does-not-exist" onerror="window.xssDetected=true;" />';
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill(xssPayload);
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-success-message"]')).toBeVisible();
    
    // Wait for reviews list to render and check if the XSS script was executed
    await page.waitForTimeout(1000);
    
    const xssFlag = await page.evaluate(() => window.xssDetected);
    
    // Assert that no XSS was executed. This assertion will FAIL because window.xssDetected is true!
    expect(xssFlag).toBeUndefined();
  });

  // TC-62 (LỖI CỐ Ý - FAILED): Điểm trung bình không được làm tròn ở trang chi tiết
  // Mục tiêu: Sau khi thêm review 1 sao cho khóa 1, điểm trung bình (5+4+1)/3 phải hiển thị gọn là "3.3".
  // Ý đồ lỗi: Trang chi tiết quên .toFixed(1) nên hiển thị nguyên số thực 3.3333333333333335 khiến test so khớp chính xác FAILED.
  test('TC-62 (FAILED INTENTIONAL): Average rating not rounded on detail page', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();

    await page.locator('[data-testid="review-rating-1"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Đánh giá tạo điểm lẻ');
    await page.locator('[data-testid="review-submit-btn"]').click();
    await page.waitForTimeout(400); // chờ modal refetch điểm mới

    // Điểm trung bình hiển thị phải gọn là "3.3", nhưng thực tế ra "3.3333333333333335".
    const ratingStrong = page.locator('.modal-meta-row strong').nth(1);
    await expect(ratingStrong).toHaveText('3.3'); // FAIL: thực tế là 3.3333333333333335
  });

});
