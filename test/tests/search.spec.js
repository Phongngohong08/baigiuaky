import { test, expect } from '@playwright/test';

test.describe('Feature 1: Course Search & Filters', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Reset database state before each test
    const resetRes = await request.post('https://khoahoc.phongngohong.online/api/reset');
    expect(resetRes.ok()).toBeTruthy();
    
    // Go to homepage
    await page.goto('/');
  });

  // TC-01: Kiểm tra tính năng tìm kiếm cơ bản với từ khóa chính xác
  // Mục tiêu: Khi nhập đúng từ khóa ("Cơ Bản"), hệ thống phải lọc ra đúng khóa học chứa từ khóa đó.
  test('TC-01: Search with accurate keyword', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Cơ Bản');
    
    // Check if course cards are filtered
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Golang Cơ Bản');
  });

  // TC-02: Kiểm tra tính năng tìm kiếm không phân biệt chữ hoa/chữ thường
  // Mục tiêu: Nhập từ khóa dạng thường ("golang") hay hoa ("GOLANG") đều phải cho ra số lượng kết quả trùng khớp giống nhau.
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

  // TC-03: Kiểm tra tìm kiếm với từ khóa không tồn tại
  // Mục tiêu: Khi tìm với từ khóa lạ, giao diện phải hiển thị thông báo "Không tìm thấy khóa học nào phù hợp".
  test('TC-03: Search with non-existent keyword', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Python Django Machine Learning');
    
    // Check for empty state message
    const emptyState = page.locator('[data-testid="empty-search-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Không tìm thấy khóa học nào phù hợp');
  });

  // TC-04: Kiểm tra tìm kiếm khi để trống ô nhập
  // Mục tiêu: Khi xóa trắng từ khóa tìm kiếm, hệ thống phải hiển thị đầy đủ tất cả 6 khóa học ban đầu.
  test('TC-04: Search with empty query shows all courses', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('');
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(6); // Total seeded courses is 6
  });

  // TC-05: Kiểm tra tìm kiếm chỉ chứa khoảng trắng
  // Mục tiêu: Khi nhập chuỗi toàn dấu cách, hệ thống phải tự động loại bỏ khoảng trắng (hoặc coi như từ khóa không khớp) và hiển thị thông báo không tìm thấy kết quả phù hợp một cách an toàn.
  test('TC-05: Search with only spaces handled safely', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('   '); // Only spaces
    
    // Should handle safely and show empty state (no match for spaces)
    const emptyState = page.locator('[data-testid="empty-search-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Không tìm thấy khóa học nào phù hợp');
  });

  // TC-06: Kiểm thử độ an toàn bảo mật trước tấn công SQL Injection thông qua ô tìm kiếm
  // Mục tiêu: Khi hacker chèn các chuỗi truy vấn SQL độc hại vào ô tìm kiếm, hệ thống phải xử lý an toàn (không bị crash, không bị lộ dữ liệu trái phép) nhờ cơ chế parameterized query của SQLite.
  test('TC-06: Search with SQL injection payload handled safely', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Classic SQL Injection payloads
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE reviews; --",
      "golang' UNION SELECT null,null,null,null,null,null,null --"
    ];
    
    for (const payload of sqlPayloads) {
      await searchInput.fill(payload);
      
      // Should not crash the backend or cause error display, and should safely return no matches
      const emptyState = page.locator('[data-testid="empty-search-state"]');
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText('Không tìm thấy khóa học nào phù hợp');
      
      // Verify database wasn't corrupted by checking all courses again after clearing search
      await searchInput.fill('');
      const cards = page.locator('[data-testid="course-card"]');
      await expect(cards).toHaveCount(6);
    }
  });

  // TC-07: Kiểm tra bộ lọc khóa học theo danh mục (Category)
  // Mục tiêu: Khi nhấp chọn chủ đề "Golang", giao diện chỉ được phép hiển thị các khóa học thuộc nhóm chủ đề này.
  test('TC-07: Filter courses by category', async ({ page }) => {
    // Click category "Golang"
    await page.locator('[data-testid="filter-category-Go"]').click();
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(2); // 2 Go courses
    await expect(cards.first()).toContainText('Golang');
  });

  // TC-08: Kiểm tra bộ lọc khóa học theo mức học phí (Miễn phí / Có phí)
  // Mục tiêu: Khi click chọn "Miễn phí", hệ thống hiển thị đúng các khóa có giá = $0. Khi chọn "Có phí", hiển thị đúng các khóa có giá > $0.
  test('TC-08: Filter courses by price type', async ({ page }) => {
    // Click price filter "Miễn phí"
    await page.locator('[data-testid="filter-price-free"]').click();
    
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(2); // 2 free courses
    
    // Click price filter "Có phí"
    await page.locator('[data-testid="filter-price-paid"]').click();
    await expect(page.locator('[data-testid="course-card"]')).toHaveCount(4); // 4 paid courses
  });

  // TC-09 (LỖI CỐ Ý - FAILED): Tìm kiếm với từ khóa cực dài (> 200 ký tự)
  // Mục tiêu: Kiểm tra giới hạn độ dài chuỗi nhập ở frontend.
  // Ý đồ lỗi: Frontend không giới hạn ký tự, gửi chuỗi dài lên backend gây ra lỗi HTTP 500 lỗi hệ thống thay vì thông báo lỗi thân thiện. Playwright sẽ phát hiện lỗi này và báo FAILED.
  test('TC-09 (FAILED INTENTIONAL): Search with extremely long query', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    
    // Wait for the 500 response
    const responsePromise = page.waitForResponse(response => response.url().includes('/api/courses') && response.status() === 500);
    
    // Fill with string > 200 characters
    const longString = 'A'.repeat(210);
    await searchInput.fill(longString);
    
    await responsePromise;
    
    // We expect the system to handle this gracefully (200 OK or friendly error),
    // but the backend returns 500 Internal Server Error, so the following assertion will FAIL!
    const apiError = page.locator('[data-testid="api-error-display"]');
    await expect(apiError).not.toBeVisible(); // This will fail because the API error is visible!
  });

  // TC-61 (LỖI CỐ Ý - FAILED): Lọc kết hợp danh mục + mức học phí
  // Mục tiêu: Khi chọn đồng thời danh mục "Go" và mức "Có phí", hệ thống chỉ hiển thị khóa Go có phí (1 khóa: Golang Nâng Cao).
  // Ý đồ lỗi: Backend dùng else-if nên khi đã chọn danh mục thì bỏ qua bộ lọc giá, trả về cả 2 khóa Go khiến số lượng sai và test FAILED.
  test('TC-61 (FAILED INTENTIONAL): Combine category + price filter', async ({ page }) => {
    await page.locator('[data-testid="filter-category-Go"]').click();
    await page.locator('[data-testid="filter-price-paid"]').click();

    // Đúng ra chỉ còn 1 khóa Go có phí, nhưng bộ lọc giá bị bỏ qua nên trả về 2.
    const cards = page.locator('[data-testid="course-card"]');
    await expect(cards).toHaveCount(1); // FAIL: thực tế là 2
  });

});
