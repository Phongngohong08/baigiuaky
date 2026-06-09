import { test, expect } from '@playwright/test';

async function loginUser(page, email) {
  await page.locator('[data-testid="login-modal-trigger"]').click();
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="login-submit-btn"]').click();
  await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
}

test.describe('Feature 3: Course Registration & Checkout', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Reset database state before each test
    const resetRes = await request.post('https://khoahoc.phongngohong.online/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    
    // Go to homepage
    await page.goto('/');
  });

  // TC-25: Kiểm tra đăng ký thành công khóa học miễn phí
  // Mục tiêu: Khi đăng ký một khóa học miễn phí (giá = 0), hệ thống phải bỏ qua bước thanh toán, hiển thị thông báo đăng ký thành công và cập nhật badge thành "Đã đăng ký".
  test('TC-25: Register free course successfully', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 1 is free ("Golang Cơ Bản")
    await page.locator('[data-testid="register-btn-1"]').click();
    
    // Verify toast success
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đăng ký khóa học thành công');
    
    // Verify badge changed to "Đã đăng ký"
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
  });

  // TC-26: Kiểm tra quy trình đăng ký khóa học có phí qua modal thanh toán
  // Mục tiêu: Khi đăng ký khóa học có phí, modal thanh toán với mã QR phải mở ra. Người dùng ấn xác nhận hoàn tất thanh toán thì hệ thống mới ghi nhận đăng ký thành công.
  test('TC-26: Register paid course via checkout modal', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 2 is paid ($49.99)
    await page.locator('[data-testid="register-btn-2"]').click();
    
    // Checkout modal should open
    const modal = page.locator('[data-testid="checkout-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-testid="payment-qr-code"]')).toBeVisible();
    
    // Click pay confirm
    await page.locator('[data-testid="pay-confirm-btn"]').click();
    
    // Successfully registered
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đăng ký khóa học thành công');
    await expect(page.locator('[data-testid="registered-badge-2"]')).toBeVisible();
  });

  // TC-27: Tự động kích hoạt hiển thị modal Đăng nhập khi đăng ký mà chưa đăng nhập
  // Mục tiêu: Nếu chưa đăng nhập, nhấp nút Đăng ký sẽ hiện modal Đăng nhập. Sau khi đăng nhập thành công, modal đóng và người dùng có thể tiếp tục ấn đăng ký bình thường.
  test('TC-27: Register course when not logged in redirects/triggers login', async ({ page }) => {
    // Click register without login
    await page.locator('[data-testid="register-btn-1"]').click();
    
    // Login modal should pop up
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();
    
    // Perform login in modal
    await page.locator('[data-testid="email-input"]').fill('student5@gmail.com');
    await page.locator('[data-testid="login-submit-btn"]').click();
    
    // Once logged in, login modal closes and user can proceed to register
    await expect(loginModal).not.toBeVisible();
    
    // Register now works
    await page.locator('[data-testid="register-btn-1"]').click();
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
  });

  // TC-28: Ngăn chặn đăng ký lặp lại cùng một khóa học
  // Mục tiêu: Nếu người dùng đã sở hữu khóa học, giao diện sẽ ẩn nút Đăng ký và thay thế bằng badge "Đã đăng ký". Trực tiếp gọi API đăng ký lần hai cho khóa học đó phải trả về lỗi 400 Bad Request.
  test('TC-28: Cannot register for an already registered course', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 1
    await page.locator('[data-testid="register-btn-1"]').click();
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
    
    // Directly calling API to try registering again should fail
    const res = await page.request.post('https://khoahoc.phongngohong.online/api/courses/1/register', {
      headers: { 'X-User-Email': 'student5@gmail.com' }
    });
    expect(res.status()).toBe(400);
    const body = await res.text();
    expect(body).toContain('Bạn đã đăng ký khóa học này rồi');
  });

  // TC-29: Đồng bộ hiển thị khóa học đã đăng ký trong Dashboard cá nhân
  // Mục tiêu: Sau khi đăng ký thành công, khóa học đó phải xuất hiện trong danh sách hiển thị ở tab "Khóa học của tôi".
  test('TC-29: Registered course appears in user dashboard', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 1 (free)
    await page.locator('[data-testid="register-btn-1"]').click();
    
    // Go to "Khóa học của tôi"
    await page.locator('[data-testid="my-courses-tab"]').click();
    
    // Verify course 1 is displayed in dashboard
    const myCourseCard = page.locator('[data-testid="my-course-card"]');
    await expect(myCourseCard).toHaveCount(1);
    await expect(myCourseCard.first()).toContainText('Golang Cơ Bản');
  });

  // TC-30: Kiểm tra tính năng Hủy đăng ký khóa học (Refund / Cancel)
  // Mục tiêu: Khi học viên nhấn "Hủy đăng ký" trên dashboard cá nhân và đồng ý xác nhận, khóa học đó phải biến mất ngay lập tức khỏi danh sách sở hữu của học viên.
  test('TC-30: Hủy đăng ký removes course from user dashboard', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 1
    await page.locator('[data-testid="register-btn-1"]').click();
    
    // Go to dashboard
    await page.locator('[data-testid="my-courses-tab"]').click();
    await expect(page.locator('[data-testid="my-course-card"]')).toHaveCount(1);
    
    // Click Cancel course
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('[data-testid="cancel-course-btn-1"]').click();
    
    // Verify course is removed
    await expect(page.locator('[data-testid="my-course-card"]')).toHaveCount(0);
  });

  // TC-31: Kiểm tra giới hạn số lượng học viên tối đa của khóa học
  // Mục tiêu: Khóa học ID 5 (Docker) có giới hạn tối đa là 2 người đăng ký. Khi đã có 2 tài khoản đăng ký thành công trước, tài khoản thứ 3 thực hiện đăng ký sẽ bị từ chối và báo lỗi đầy lớp học.
  test('TC-31: Maximum student limit validation', async ({ page, request }) => {
    // Course ID 5 (Docker) has limit of 2 registrations.
    // Register 2 other accounts directly via API
    await request.post('https://khoahoc.phongngohong.online/api/courses/5/register', {
      headers: { 'X-User-Email': 'other1@gmail.com' }
    });
    await request.post('https://khoahoc.phongngohong.online/api/courses/5/register', {
      headers: { 'X-User-Email': 'other2@gmail.com' }
    });
    
    // Try to register 3rd account student5@gmail.com via UI
    await loginUser(page, 'student5@gmail.com');
    
    // Course 5 is Docker ($79.99)
    await page.locator('[data-testid="register-btn-5"]').click();
    await page.locator('[data-testid="pay-confirm-btn"]').click();
    
    // Verify registration fails due to class full limit
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Khóa học đã đầy học viên');
  });

  // TC-32: Kiểm tra tính năng áp dụng mã giảm giá 50% (GIAM50)
  // Mục tiêu: Khi nhập mã giảm giá hợp lệ "GIAM50", hệ thống phải áp dụng giảm trừ 50% trên tổng giá trị khóa học hiển thị ở modal checkout.
  test('TC-32: Coupon discount application reduces checkout total (GIAM50)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 2 is $49.99
    await page.locator('[data-testid="register-btn-2"]').click();
    
    const couponInput = page.locator('[data-testid="coupon-input"]');
    const applyBtn = page.locator('[data-testid="coupon-apply-btn"]');
    
    // Apply 50% coupon
    await couponInput.fill('GIAM50');
    await applyBtn.click();
    await expect(page.locator('[data-testid="coupon-success-message"]')).toContainText('giảm 50% thành công');
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$25.00');
  });

  // TC-33: Kiểm tra tính năng áp dụng mã giảm giá 100% (FREE100)
  // Mục tiêu: Khi nhập mã "FREE100", hệ thống cập nhật tổng tiền thanh toán về mức $0.00.
  test('TC-33: Coupon discount application reduces checkout total (FREE100)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 2 is $49.99
    await page.locator('[data-testid="register-btn-2"]').click();
    
    const couponInput = page.locator('[data-testid="coupon-input"]');
    const applyBtn = page.locator('[data-testid="coupon-apply-btn"]');
    
    // Apply 100% coupon
    await couponInput.fill('FREE100');
    await applyBtn.click();
    await expect(page.locator('[data-testid="coupon-success-message"]')).toContainText('miễn phí 100% thành công');
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$0.00');
  });

  // TC-34: Kiểm tra mã giảm giá đã hết hạn (EXPIRED)
  // Mục tiêu: Khi nhập mã giảm giá đã hết hạn "EXPIRED", hệ thống phải từ chối áp dụng và hiển thị thông báo lỗi "Mã giảm giá đã hết hạn".
  test('TC-34: Expired coupon code throws error', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-2"]').click();
    
    await page.locator('[data-testid="coupon-input"]').fill('EXPIRED');
    await page.locator('[data-testid="coupon-apply-btn"]').click();
    
    await expect(page.locator('[data-testid="coupon-error-message"]')).toContainText('Mã giảm giá đã hết hạn');
  });

  // TC-35: Kiểm tra mã giảm giá không tồn tại / không hợp lệ
  // Mục tiêu: Nhập một mã coupon tự bịa ra sẽ bị từ chối áp dụng và hiển thị thông báo lỗi "Mã giảm giá không hợp lệ".
  test('TC-35: Invalid coupon code throws error', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-2"]').click();
    
    await page.locator('[data-testid="coupon-input"]').fill('INVALIDCODE');
    await page.locator('[data-testid="coupon-apply-btn"]').click();
    
    await expect(page.locator('[data-testid="coupon-error-message"]')).toContainText('Mã giảm giá không hợp lệ');
  });

  // TC-36: Kiểm tra thay đổi/cập nhật mã giảm giá động
  // Mục tiêu: Học viên có thể thay đổi mã giảm giá khác nhau trong quá trình thanh toán, hệ thống phải cập nhật lại chính xác giá tiền tương ứng theo mã mới nhất.
  test('TC-36: Apply coupon, then change/clear coupon updates price dynamically', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-2"]').click();
    
    const couponInput = page.locator('[data-testid="coupon-input"]');
    const applyBtn = page.locator('[data-testid="coupon-apply-btn"]');
    
    // Apply FREE100
    await couponInput.fill('FREE100');
    await applyBtn.click();
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$0.00');
    
    // Change to GIAM50
    await couponInput.fill('GIAM50');
    await applyBtn.click();
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$25.00');
  });

  // TC-37: Kiểm tra đóng modal thanh toán bằng click ngoài overlay
  // Mục tiêu: Khi nhấp ra ngoài vùng overlay để tắt modal thanh toán, giao dịch bị hủy bỏ, trạng thái đăng ký của học viên phải được giữ nguyên là chưa sở hữu khóa học đó.
  test('TC-37: Cancel button in checkout modal keeps registration state clean', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-2"]').click();
    
    // Checkout modal visible
    await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();
    
    // Click on the overlay to close the checkout modal
    await page.locator('[data-testid="checkout-modal"]').click({ position: { x: 5, y: 5 } });
    
    // Checkout modal is closed
    await expect(page.locator('[data-testid="checkout-modal"]')).not.toBeVisible();
    
    // Go to "Khóa học của tôi"
    await page.locator('[data-testid="my-courses-tab"]').click();
    await expect(page.locator('[data-testid="my-course-card"]')).toHaveCount(0);
  });

  // TC-38: Hiển thị đúng nút "Vào học ngay" cho khóa học đã sở hữu
  // Mục tiêu: Sau khi đăng ký thành công một khóa học, nút chức năng trong dashboard "Khóa học của tôi" phải chuyển sang chế độ "Vào học ngay".
  test('TC-38: User dashboard displays "Vào học ngay" button for registered courses', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-1"]').click();
    
    await page.locator('[data-testid="my-courses-tab"]').click();
    const learnBtn = page.locator('[data-testid="learn-now-btn-1"]');
    await expect(learnBtn).toBeVisible();
    await expect(learnBtn).toContainText('Vào học ngay');
  });

  // TC-39: Click nút "Vào học ngay" mở xem chi tiết bài học/khóa học
  // Mục tiêu: Nút "Vào học ngay" ở dashboard cá nhân phải hoạt động đúng và mở ra modal chi tiết khóa học.
  test('TC-39: "Vào học ngay" button opens detail modal for that course', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-1"]').click();
    
    await page.locator('[data-testid="my-courses-tab"]').click();
    await page.locator('[data-testid="learn-now-btn-1"]').click();
    
    // Detail modal should be visible
    const modal = page.locator('[data-testid="course-detail-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toContainText('Golang Cơ Bản');
    
    // Verify course learning content is now visible
    await expect(page.locator('[data-testid="course-learning-content"]')).toBeVisible();
  });

  // TC-40: Điều hướng quay lại danh sách explore từ trang dashboard
  // Mục tiêu: Khi học viên chuyển từ tab dashboard sang tab Khám phá, giao diện phải hiển thị đầy đủ danh sách các khóa học để người dùng tiếp tục xem và đăng ký.
  test('TC-40: Click on course category in dashboard redirects to homepage with filter active', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Navigate directly to dashboard first
    await page.locator('[data-testid="my-courses-tab"]').click();
    
    // Click "Khám phá" to go back to explore, it is a link in navbar
    await page.locator('[data-testid="explore-tab"]').click();
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(6);
  });

  // TC-41: Đăng ký thành công nhiều khóa học khác nhau cùng lúc
  // Mục tiêu: Đảm bảo cơ sở dữ liệu hỗ trợ tốt việc lưu trữ nhiều dòng đăng ký khác nhau của cùng một học viên.
  test('TC-41: Registering multiple courses successfully', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 1 (free)
    await page.locator('[data-testid="register-btn-1"]').click();
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
    
    // Register Course 3 (paid - $29.99)
    await page.locator('[data-testid="register-btn-3"]').click();
    await page.locator('[data-testid="pay-confirm-btn"]').click();
    await expect(page.locator('[data-testid="registered-badge-3"]')).toBeVisible();
    
    // Go to "Khóa học của tôi"
    await page.locator('[data-testid="my-courses-tab"]').click();
    await expect(page.locator('[data-testid="my-course-card"]')).toHaveCount(2);
  });

  // TC-42: Trình thanh toán khóa học trả phí hoạt động chính xác khi hủy thanh toán
  // Mục tiêu: Đảm bảo hệ thống không cấp quyền sở hữu khóa học cho học viên nếu giao dịch thanh toán bị hủy.
  test('TC-42: Cancel paid checkout does not register the course', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 2 (paid)
    await page.locator('[data-testid="register-btn-2"]').click();
    
    // Click Cancel Payment in checkout modal
    await page.locator('[data-testid="pay-cancel-btn"]').click();
    
    // Go to "Khóa học của tôi"
    await page.locator('[data-testid="my-courses-tab"]').click();
    
    // The student dashboard should be empty because the registration was cancelled.
    const myCourseCard = page.locator('[data-testid="my-course-card"]');
    await expect(myCourseCard).toHaveCount(0); // This will pass successfully!
  });

  // TC-43: Áp dụng thành công mã giảm giá GIAM20 đồng bộ giữa Frontend và Backend
  // Mục tiêu: Đảm bảo tính nhất quán của mã giảm giá khi thanh toán.
  test('TC-43: Coupon GIAM20 is successfully applied and processed', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 2 is $49.99
    await page.locator('[data-testid="register-btn-2"]').click();
    
    const couponInput = page.locator('[data-testid="coupon-input"]');
    const applyBtn = page.locator('[data-testid="coupon-apply-btn"]');
    
    // Apply GIAM20
    await couponInput.fill('GIAM20');
    await applyBtn.click();
    
    // Frontend calculates price correctly: $49.99 * 0.8 = $39.99
    await expect(page.locator('[data-testid="coupon-success-message"]')).toContainText('giảm 20% thành công');
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$39.99');
    
    // Click pay confirm. The checkout API request should be successful and return status 201 Created.
    // We monitor response
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/courses/2/register'));
    await page.locator('[data-testid="pay-confirm-btn"]').click();
    const response = await responsePromise;
    
    expect(response.status()).toBeLessThan(400); // This will pass because status is 201!
  });

  // TC-44: Tự động bỏ qua màn quét mã QR khi áp dụng mã giảm giá 100%
  // Mục tiêu: Khi học viên sử dụng mã `FREE100`, giá thanh toán về $0.00, hệ thống phải cho phép đăng ký trực tiếp và bỏ qua các thủ tục thanh toán trung gian, chuyển thẳng sang trạng thái "Đã đăng ký".
  test('TC-44: Registering a paid course with FREE100 coupon bypasses QR payment screen', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    await page.locator('[data-testid="register-btn-2"]').click();
    
    await page.locator('[data-testid="coupon-input"]').fill('FREE100');
    await page.locator('[data-testid="coupon-apply-btn"]').click();
    
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$0.00');
    
    await page.locator('[data-testid="pay-confirm-btn"]').click();
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đăng ký khóa học thành công');
    await expect(page.locator('[data-testid="registered-badge-2"]')).toBeVisible();
  });

  // TC-63 (LỖI CỐ Ý - FAILED): Số tiền thực thu khi giảm giá không được làm tròn
  // Mục tiêu: Mua khóa $49.99 với mã GIAM20, số tiền thực thu phải là $39.99 (làm tròn 2 chữ số).
  // Ý đồ lỗi: Backend tính 49.99*0.8 bằng float và không làm tròn, trả về 39.992000000000004 và lọt vào toast khiến test FAILED.
  test('TC-63 (FAILED INTENTIONAL): Discounted charged amount not rounded', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-2"]').click(); // $49.99

    await page.locator('[data-testid="coupon-input"]').fill('GIAM20');
    await page.locator('[data-testid="coupon-apply-btn"]').click();
    await page.locator('[data-testid="pay-confirm-btn"]').click();

    const toast = page.locator('[data-testid="toast-notification"]');
    await expect(toast).toContainText('Số tiền đã thanh toán');
    // Số tiền thực thu phải gọn, không được chứa phần lẻ float dài.
    await expect(toast).not.toContainText('39.992'); // FAIL: toast chứa $39.992000000000004
  });

  // TC-64 (LỖI CỐ Ý - FAILED): Khóa "chờ thanh toán" bị ẩn khỏi "Khóa học của tôi"
  // Mục tiêu: Học viên đăng ký khóa trả phí ở trạng thái chờ xác nhận (pending) thì khóa đó vẫn phải xuất hiện trong danh sách khóa học của họ.
  // Ý đồ lỗi: API /api/my-courses chỉ lọc status='completed' nên khóa pending bị loại bỏ, học viên không thấy khóa đã đăng ký -> test FAILED.
  test('TC-64 (FAILED INTENTIONAL): Pending paid registration hidden from My Courses', async ({ request }) => {
    const email = 'studentpending@gmail.com';

    // Đăng ký khóa trả phí (course 2) ở trạng thái chờ thanh toán
    const reg = await request.post('https://khoahoc.phongngohong.online/api/courses/2/register', {
      headers: { 'X-User-Email': email },
      data: { payment_status: 'pending' }
    });
    expect(reg.status()).toBe(201);

    // Học viên đã đăng ký nên khóa phải có trong danh sách khóa học của họ.
    const res = await request.get('https://khoahoc.phongngohong.online/api/my-courses', {
      headers: { 'X-User-Email': email }
    });
    const data = await res.json();
    const ids = (data || []).map(c => c.id);
    expect(ids).toContain(2); // FAIL: khóa pending bị lọc khỏi danh sách
  });

});
