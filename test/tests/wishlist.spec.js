import { test, expect } from '@playwright/test';

async function loginUser(page, email) {
  await page.locator('[data-testid="login-modal-trigger"]').click();
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="login-submit-btn"]').click();
  await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
}

test.describe('Feature 4: Course Wishlist', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Reset database state before each test
    const resetRes = await request.post('http://127.0.0.1:8080/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    
    // Go to homepage
    await page.goto('/');
  });

  // TC-45: Thêm khóa học vào danh sách yêu thích thành công khi đã đăng nhập
  // Mục tiêu: Khi đã đăng nhập, nhấp nút Trái tim sẽ thêm khóa học vào danh sách yêu thích, hiện thông báo thành công và hiển thị trái tim dạng active (đỏ/đầy).
  test('TC-45: Add course to wishlist successfully when logged in', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 1 heart button
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    await heartBtn.click();
    
    // Toast should show success
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đã thêm vào danh sách yêu thích');
    
    // Heart should be filled/active
    await expect(heartBtn).toHaveClass(/active/);
  });

  // TC-46: Chặn thêm vào yêu thích và yêu cầu đăng nhập nếu người dùng chưa đăng nhập
  // Mục tiêu: Khi chưa đăng nhập, nhấp nút trái tim sẽ tự động kích hoạt và hiển thị modal đăng nhập để bảo vệ tính năng.
  test('TC-46: Add to wishlist when not logged in triggers login modal', async ({ page }) => {
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    await heartBtn.click();
    
    // Login modal should pop up
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
  });

  // TC-47: Xóa khóa học khỏi danh sách yêu thích trực tiếp từ trang chủ
  // Mục tiêu: Nhấp tiếp vào trái tim đỏ (đã thích) của khóa học trên trang chủ sẽ xóa khóa học đó khỏi danh sách yêu thích, hiện thông báo và đổi trái tim về trạng thái viền xám rỗng.
  test('TC-47: Remove course from wishlist from homepage', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    
    // Add to wishlist
    await heartBtn.click();
    await expect(heartBtn).toHaveClass(/active/);
    
    // Remove from wishlist
    await heartBtn.click();
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đã xóa khỏi danh sách yêu thích');
    await expect(heartBtn).not.toHaveClass(/active/);
  });

  // TC-48: Kiểm tra giao diện danh sách yêu thích trống (Empty State)
  // Mục tiêu: Khi chưa yêu thích khóa học nào, tab "Yêu thích" phải hiển thị thông báo thân thiện "Chưa có khóa học yêu thích nào".
  test('TC-48: Empty wishlist view state', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Switch to wishlist tab
    await page.locator('[data-testid="wishlist-tab"]').click();
    
    // Should show empty state message
    const emptyState = page.locator('[data-testid="empty-wishlist-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Chưa có khóa học yêu thích nào');
  });

  // TC-49: Hiển thị danh sách các khóa học đã thích trong tab Yêu thích
  // Mục tiêu: Khóa học đã được thả tim phải xuất hiện đầy đủ trong giao diện hiển thị của tab "Yêu thích".
  test('TC-49: Wishlist tab displays favorited courses', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Favorite Course 1
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    
    // Navigate to wishlist
    await page.locator('[data-testid="wishlist-tab"]').click();
    
    // Course should be listed
    const cards = page.locator('[data-testid="wishlist-course-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Golang Cơ Bản');
  });

  // TC-50: Mở modal xem thông tin chi tiết khóa học từ tab Yêu thích
  // Mục tiêu: Nhấp nút Chi tiết của một thẻ khóa học yêu thích trong tab Yêu thích phải kích hoạt mở thành công modal chi tiết khóa học đó.
  test('TC-50: Course details can be opened from wishlist tab', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    await page.locator('[data-testid="wishlist-tab"]').click();
    
    // Click details button inside wishlist
    await page.locator('[data-testid="wishlist-course-detail-btn-1"]').click();
    
    // Detail modal should be visible
    const modal = page.locator('[data-testid="course-detail-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toContainText('Golang Cơ Bản');
  });

  // TC-51: Đăng ký tham gia học trực tiếp khóa học từ tab Yêu thích
  // Mục tiêu: Học viên có thể click Đăng ký và hoàn tất thanh toán trực tiếp cho khóa học ngay từ tab Yêu thích.
  test('TC-51: Register course directly from wishlist tab', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Favorite Course 2 (paid)
    await page.locator('[data-testid="wishlist-heart-toggle-2"]').click();
    await page.locator('[data-testid="wishlist-tab"]').click();
    
    // Click Register from Wishlist
    await page.locator('[data-testid="wishlist-register-btn-2"]').click();
    
    // Checkout modal opens
    await expect(page.locator('[data-testid="checkout-modal"]')).toBeVisible();
    await page.locator('[data-testid="pay-confirm-btn"]').click();
    
    // Badge updates to "Đã đăng ký"
    await expect(page.locator('[data-testid="wishlist-registered-badge-2"]')).toBeVisible();
  });

  // TC-52: Bỏ yêu thích trực tiếp bên trong tab Yêu thích
  // Mục tiêu: Khi học viên nhấp nút bỏ yêu thích (click trái tim đỏ) trực tiếp ở tab Yêu thích, thẻ khóa học đó phải biến mất ngay lập tức và giao diện cập nhật trạng thái trống (nếu không còn khóa nào).
  test('TC-52: Remove course from wishlist directly inside wishlist tab', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    await page.locator('[data-testid="wishlist-tab"]').click();
    await expect(page.locator('[data-testid="wishlist-course-card"]')).toHaveCount(1);
    
    // Click heart button in Wishlist tab to unfavorite
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    
    // Card should disappear immediately
    await expect(page.locator('[data-testid="wishlist-course-card"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="empty-wishlist-state"]')).toBeVisible();
  });

  // TC-53: Đồng bộ trạng thái Đăng ký thành công giữa các tab giao diện
  // Mục tiêu: Khi đăng ký học thành công khóa học từ tab Yêu thích, trạng thái nút chức năng của khóa đó trong tab Khám phá (Explore) cũng phải được tự động cập nhật thành "Đã đăng ký" để đảm bảo tính đồng nhất dữ liệu.
  test('TC-53: Registration state syncs across Wishlist and Explore tabs', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Favorite Course 1 (free)
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    await page.locator('[data-testid="wishlist-tab"]').click();
    
    // Register
    await page.locator('[data-testid="wishlist-register-btn-1"]').click();
    await expect(page.locator('[data-testid="wishlist-registered-badge-1"]')).toBeVisible();
    
    // Go to Explore tab
    await page.locator('[data-testid="explore-tab"]').click();
    
    // Check that it shows "Đã đăng ký" there as well
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
  });

  // TC-54: Đảm bảo class CSS active hiển thị đúng đắn của nút Trái tim
  // Mục tiêu: Nút thả tim phải phản ánh đúng trạng thái đã thích (có class CSS active) hoặc chưa thích (không có class active) một cách trực quan.
  test('TC-54: Wishlist heart button has correct active/inactive classes and testids', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    await expect(heartBtn).toBeVisible();
    await expect(heartBtn).not.toHaveClass(/active/);
    
    await heartBtn.click();
    await expect(heartBtn).toHaveClass(/active/);
  });

  // TC-55: Xóa thông tin danh sách yêu thích của người dùng trên giao diện khi đăng xuất
  // Mục tiêu: Khi học viên nhấp nút Đăng xuất, tab "Yêu thích" phải bị ẩn hoàn toàn khỏi thanh điều hướng của website.
  test('TC-55: Logout clears the wishlist items in the UI', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Favorite Course 1
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    
    // Logout
    await page.locator('[data-testid="logout-btn"]').click();
    
    // Wishlist tab should not be visible anymore
    await expect(page.locator('[data-testid="wishlist-tab"]')).not.toBeVisible();
  });

  // TC-56: Cô lập danh sách yêu thích của các tài khoản người dùng khác nhau
  // Mục tiêu: Đảm bảo danh sách yêu thích của mỗi tài khoản là riêng biệt, đăng nhập tài khoản khác sẽ hiển thị đúng danh sách yêu thích riêng của họ, không bị lộ hay lẫn lộn.
  test('TC-56: Logging in as different users displays their respective wishlists', async ({ page }) => {
    // User 1 favors Course 1
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    await page.locator('[data-testid="logout-btn"]').click();
    
    // User 2 favors Course 2
    await loginUser(page, 'otheruser@gmail.com');
    await page.locator('[data-testid="wishlist-heart-toggle-2"]').click();
    
    // Check wishlist tab for User 2 has only Course 2
    await page.locator('[data-testid="wishlist-tab"]').click();
    await expect(page.locator('[data-testid="wishlist-course-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="wishlist-course-card"]').first()).toContainText('Golang Nâng Cao');
  });

  // TC-57: Hiển thị và cập nhật động số lượng yêu thích trên Badge đếm
  // Mục tiêu: Số lượng hiển thị trên Badge đếm ở tab Yêu thích `Yêu thích (N)` phải cập nhật chính xác và tức thời mỗi khi học viên nhấn thêm/bớt khóa học.
  test('TC-57: Wishlist count badge is updated dynamically on the Wishlist tab', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Badge initially shows (0) or is empty
    const badge = page.locator('[data-testid="wishlist-count-badge"]');
    await expect(badge).toHaveText('(0)');
    
    // Favorite Course 1
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    await expect(badge).toHaveText('(1)');
    
    // Favorite Course 2
    await page.locator('[data-testid="wishlist-heart-toggle-2"]').click();
    await expect(badge).toHaveText('(2)');
    
    // Unfavorite Course 1
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    await expect(badge).toHaveText('(1)');
  });

  // TC-58: Khôi phục yêu thích một khóa học đã bị xóa
  // Mục tiêu: Khi học viên bỏ thích một khóa học rồi bấm thích lại, hệ thống vẫn phải xử lý trơn tru và thêm lại bình thường.
  test('TC-58: Re-adding a removed course to wishlist works', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    
    // Add -> Remove -> Add again
    await heartBtn.click();
    await expect(heartBtn).toHaveClass(/active/);
    
    await heartBtn.click();
    await expect(heartBtn).not.toHaveClass(/active/);
    
    await heartBtn.click();
    await expect(heartBtn).toHaveClass(/active/);
  });

  // TC-59 (LỖI CỐ Ý - FAILED): Chặn spam nhấn nút Trái tim liên tục
  // Mục tiêu: Frontend chặn spam nhấp liên tục để tránh gửi các yêu cầu đồng thời lên máy chủ.
  // Ý đồ lỗi: Frontend không chặn spam, backend xử lý trễ (`150ms`) làm trùng lặp câu lệnh INSERT của SQLite, gây ra lỗi SQLite UNIQUE constraint conflict (HTTP 500) khiến Playwright bắt lỗi và FAILED.
  test('TC-59 (FAILED INTENTIONAL): Spam wishlist toggle rapidly', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Wait for heart button to be visible
    await expect(page.locator('[data-testid="wishlist-heart-toggle-1"]')).toBeVisible();

    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/wishlist') && response.request().method() === 'POST') {
        responses.push(response);
      }
    });

    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="wishlist-heart-toggle-1"]');
      if (btn) {
        btn.click();
        btn.click();
      }
    });
    
    // Wait for responses
    await page.waitForTimeout(1000);
    
    expect(responses.length).toBe(2);
    
    // Both responses should be successful, but due to SQL constraint conflict, second will be 500!
    for (const res of responses) {
      expect(res.status()).toBeLessThan(400); // This will fail because one response is 500!
    }
  });

  // TC-60: Khóa học yêu thích vẫn tồn tại khi điều hướng qua lại giữa các Tab
  // Mục tiêu: Khóa học đã thả tim không bị mất khỏi tab Yêu thích sau khi chuyển sang tab khác (ví dụ: sang tab Khóa học của tôi rồi quay lại).
  test('TC-60: Course added to wishlist remains after tab navigation', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    await page.locator('[data-testid="wishlist-heart-toggle-1"]').click();
    
    // Go to My Courses tab
    await page.locator('[data-testid="my-courses-tab"]').click();
    await expect(page.locator('[data-testid="my-courses-tab"]')).toHaveClass(/active/);
    
    // Go to Wishlist tab
    await page.locator('[data-testid="wishlist-tab"]').click();
    await expect(page.locator('[data-testid="wishlist-course-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="wishlist-course-card"]').first()).toContainText('Golang Cơ Bản');
  });

});
