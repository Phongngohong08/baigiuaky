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

  test('TC-11: Submit review successfully', async ({ page }) => {
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

  test('TC-12: Submit review when not logged in', async ({ page }) => {
    // Open details of Course 1 (not logged in)
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // Review form elements should display warning and be disabled
    await expect(page.locator('[data-testid="review-unauthorized-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-comment-input"]')).toBeDisabled();
    await expect(page.locator('[data-testid="review-submit-btn"]')).toBeDisabled();
  });

  test('TC-13: Submit review with empty comment but has stars', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill(''); // Empty comment
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-success-message"]')).toBeVisible();
  });

  test('TC-14: Submit review with invalid stars (0 stars)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // In our UI, star rating defaults to 5. We must trigger 0 stars if we have a way,
    // or simulate sending 0 rating to the API.
    // Let's call the API directly using request to test boundary value 0 stars
    const res = await page.request.post('http://127.0.0.1:8080/api/courses/1/reviews', {
      headers: { 'X-User-Email': 'student5@gmail.com' },
      data: { rating: 0, comment: 'Không chọn sao nào' }
    });
    
    expect(res.status()).toBe(400);
    const text = await res.text();
    expect(text).toContain('Vui lòng chọn số sao từ 1 đến 5');
  });

  test('TC-15: Review comment too short (< 3 characters)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-rating-5"]').click();
    await page.locator('[data-testid="review-comment-input"]').fill('Hi'); // 2 chars
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bình luận phải có ít nhất 3 ký tự');
  });

  test('TC-16: Review comment too long (> 500 characters)', async ({ page }) => {
    await loginUser(page, 'student5@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    const longComment = 'A'.repeat(505);
    await page.locator('[data-testid="review-comment-input"]').fill(longComment);
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bình luận không được vượt quá 500 ký tự');
  });

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

  test('TC-18: One account reviews multiple times throws error', async ({ page }) => {
    // student1@gmail.com has already reviewed course 1 (seeded in db)
    await loginUser(page, 'student1@gmail.com');
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    await page.locator('[data-testid="review-comment-input"]').fill('Thêm đánh giá mới nữa...');
    await page.locator('[data-testid="review-submit-btn"]').click();
    
    await expect(page.locator('[data-testid="review-error-message"]')).toContainText('Bạn đã đánh giá khóa học này rồi');
  });

  test('TC-19: Average score updates accurately', async ({ page }) => {
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

  test('TC-20 (FAILED INTENTIONAL): Spam review submission clicks', async ({ page }) => {
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
    
    // We expect the system to block spam (only 1 review from student5).
    // But due to the race condition bug, it creates 2 duplicate reviews in the database!
    // The test asserts that there is ONLY 1 review from student5, so this assertion will FAIL.
    const student5Reviews = page.locator('[data-testid="review-item"]', { hasText: 'student5@gmail.com' });
    await expect(student5Reviews).toHaveCount(1); // This will fail because count will be 2!
  });

});
