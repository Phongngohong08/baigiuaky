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

  test('TC-31: Add course to wishlist successfully when logged in', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Course 1 heart button
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    await heartBtn.click();
    
    // Toast should show success
    await expect(page.locator('[data-testid="toast-notification"]')).toContainText('Đã thêm vào danh sách yêu thích');
    
    // Heart should be filled/active
    await expect(heartBtn).toHaveClass(/active/);
  });

  test('TC-32: Add to wishlist when not logged in triggers login modal', async ({ page }) => {
    const heartBtn = page.locator('[data-testid="wishlist-heart-toggle-1"]');
    await heartBtn.click();
    
    // Login modal should pop up
    await expect(page.locator('[data-testid="login-modal"]')).toBeVisible();
  });

  test('TC-33: Remove course from wishlist from homepage', async ({ page }) => {
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

  test('TC-34: Empty wishlist view state', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // Switch to wishlist tab
    await page.locator('[data-testid="wishlist-tab"]').click();
    
    // Should show empty state message
    const emptyState = page.locator('[data-testid="empty-wishlist-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Chưa có khóa học yêu thích nào');
  });

  test('TC-35: Wishlist tab displays favorited courses', async ({ page }) => {
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

  test('TC-36: Course details can be opened from wishlist tab', async ({ page }) => {
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

  test('TC-37: Register course directly from wishlist tab', async ({ page }) => {
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

  test('TC-38: Remove course from wishlist directly inside wishlist tab', async ({ page }) => {
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

  test('TC-39: Registration state syncs across Wishlist and Explore tabs', async ({ page }) => {
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

  test('TC-40 (FAILED INTENTIONAL): Spam wishlist toggle rapidly', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    
    // We expect all responses to wishlist toggle to be successful (status 200 or 201)
    // But under rapid spam clicks, the second request fails with HTTP 500 due to SQLite UNIQUE constraint conflict,
    // so this test will fail on the status assertion!
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
    
    // Both responses should be successful
    for (const res of responses) {
      expect(res.status()).toBeLessThan(400); // This will fail because one response is 500!
    }
  });

});
