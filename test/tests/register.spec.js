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
    const resetRes = await request.post('http://127.0.0.1:8080/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    
    // Go to homepage
    await page.goto('/');
  });

  test('TC-21: Register free course successfully', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 1 is free ("Golang Cơ Bản")
    await page.locator('[data-testid="register-btn-1"]').click();
    
    // Verify toast success
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đăng ký khóa học thành công');
    
    // Verify badge changed to "Đã đăng ký"
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
  });

  test('TC-22: Register paid course via checkout modal', async ({ page }) => {
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

  test('TC-23: Register course when not logged in redirects/triggers login', async ({ page }) => {
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

  test('TC-24: Cannot register for an already registered course', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 1
    await page.locator('[data-testid="register-btn-1"]').click();
    await expect(page.locator('[data-testid="registered-badge-1"]')).toBeVisible();
    
    // Directly calling API to try registering again should fail
    const res = await page.request.post('http://127.0.0.1:8080/api/courses/1/register', {
      headers: { 'X-User-Email': 'student5@gmail.com' }
    });
    expect(res.status()).toBe(400);
    const body = await res.text();
    expect(body).toContain('Bạn đã đăng ký khóa học này rồi');
  });

  test('TC-25: Registered course appears in user dashboard', async ({ page }) => {
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

  test('TC-26: Hủy đăng ký removes course from user dashboard', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 1
    await page.locator('[data-testid="register-btn-1"]').click();
    
    // Go to dashboard
    await page.locator('[data-testid="my-courses-tab"]').click();
    await expect(page.locator('[data-testid="my-course-card"]')).toHaveCount(1);
    
    // Click Cancel course (confirm prompt mock is needed or standard confirm event)
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await page.locator('[data-testid="cancel-course-btn-1"]').click();
    
    // Verify course is removed
    await expect(page.locator('[data-testid="my-course-card"]')).toHaveCount(0);
  });

  test('TC-27: Maximum student limit validation', async ({ page, request }) => {
    // Course ID 5 (Docker) has limit of 2 registrations.
    // Register 2 other accounts directly via API
    await request.post('http://127.0.0.1:8080/api/courses/5/register', {
      headers: { 'X-User-Email': 'other1@gmail.com' }
    });
    await request.post('http://127.0.0.1:8080/api/courses/5/register', {
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

  test('TC-28: Coupon discount application reduces checkout total', async ({ page }) => {
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
    
    // Apply 100% coupon
    await couponInput.fill('FREE100');
    await applyBtn.click();
    await expect(page.locator('[data-testid="checkout-discounted-price"]')).toContainText('$0.00');
  });

  test('TC-29: Expired coupon code throws error', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="register-btn-2"]').click();
    
    await page.locator('[data-testid="coupon-input"]').fill('EXPIRED');
    await page.locator('[data-testid="coupon-apply-btn"]').click();
    
    await expect(page.locator('[data-testid="coupon-error-message"]')).toContainText('Mã giảm giá đã hết hạn');
  });

  test('TC-30 (FAILED INTENTIONAL): Cancel paid checkout bypasses payment', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Register Course 2 (paid)
    await page.locator('[data-testid="register-btn-2"]').click();
    
    // Click Cancel Payment in checkout modal
    await page.locator('[data-testid="pay-cancel-btn"]').click();
    
    // Go to "Khóa học của tôi"
    await page.locator('[data-testid="my-courses-tab"]').click();
    
    // We expect the student to NOT be registered because they cancelled payment.
    // However, due to the backend logic bug, they are successfully registered!
    // The test asserts that the student dashboard is empty, so this assertion will FAIL.
    const myCourseCard = page.locator('[data-testid="my-course-card"]');
    await expect(myCourseCard).toHaveCount(0); // This will fail because count will be 1!
  });

});
