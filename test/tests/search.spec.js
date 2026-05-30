import { test, expect } from '@playwright/test';

test.describe('Feature 1: Course Search & Filters', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Reset database state before each test
    const resetRes = await request.post('http://127.0.0.1:8080/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    
    // Go to homepage
    await page.goto('/');
  });

  test('TC-01: Search with accurate keyword', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Cơ Bản');
    
    // Check if course cards are filtered
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Golang Cơ Bản');
  });

  test('TC-02: Search is case-insensitive', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    await searchInput.fill('golang');
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(2);
    const countLower = await page.locator('[data-testid="course-card"]').count();
    
    await searchInput.fill('GOLANG');
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(2);
    const countUpper = await page.locator('[data-testid="course-card"]').count();
    
    expect(countLower).toBe(countUpper);
    expect(countLower).toBeGreaterThan(0);
  });

  test('TC-03: Search with non-existent keyword', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Python Django Machine Learning');
    
    // Check for empty state message
    const emptyState = page.locator('[data-testid="empty-search-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Không tìm thấy khóa học nào phù hợp');
  });

  test('TC-04: Search with empty query shows all courses', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('');
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(6); // Total seeded courses is 6
  });

  test('TC-05: Search with special characters handled safely', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('@#$%^&*');
    
    // Should handle safely and show empty state
    const emptyState = page.locator('[data-testid="empty-search-state"]');
    await expect(emptyState).toBeVisible();
  });

  test('TC-06: Filter courses by category', async ({ page }) => {
    // Click category "Golang"
    await page.locator('[data-testid="filter-category-Go"]').click();
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(2); // 2 Go courses
    await expect(cards.first()).toContainText('Golang');
  });

  test('TC-07: Filter courses by price type', async ({ page }) => {
    // Click price filter "Miễn phí"
    await page.locator('[data-testid="filter-price-free"]').click();
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(2); // 2 free courses
    
    // Click price filter "Có phí"
    await page.locator('[data-testid="filter-price-paid"]').click();
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(4); // 4 paid courses
  });

  test('TC-08: Combined search and filters', async ({ page }) => {
    // Category = Frontend, Price = Paid, Search = Next.js
    await page.locator('[data-testid="filter-category-Frontend"]').click();
    await page.locator('[data-testid="filter-price-paid"]').click();
    await page.locator('[data-testid="search-input"]').fill('Next.js');
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Next.js 14');
  });

  test('TC-09: Click course card detail opens modal', async ({ page }) => {
    // Click details button for course ID 1
    await page.locator('[data-testid="course-detail-btn-1"]').click();
    
    // Modal should be visible
    const modal = page.locator('[data-testid="course-detail-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toContainText('Golang Cơ Bản');
  });

  test('TC-10 (FAILED INTENTIONAL): Search with extremely long query', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Wait for the 500 response
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/courses') && response.status() === 500);
    
    // Fill with string > 200 characters
    const longString = 'A'.repeat(210);
    await searchInput.fill(longString);
    
    await responsePromise;
    
    // We expect the system to handle this gracefully (200 OK or friendly error),
    // but the backend returns 500 Internal Server Error, so the following assertion will FAIL!
    // This demonstrates Playwright catching the backend error.
    const apiError = page.locator('[data-testid="api-error-display"]');
    await expect(apiError).not.toBeVisible(); // This will fail because the API error is visible!
  });

});
