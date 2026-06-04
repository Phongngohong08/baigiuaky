package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"
)

func EnableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Email, Authorization, X-Admin-Key")
}

// adminKey returns the secret key required for /api/admin/* endpoints.
// It can be overridden via the ADMIN_KEY environment variable.
func adminKey() string {
	if k := os.Getenv("ADMIN_KEY"); k != "" {
		return k
	}
	return "admin@123"
}

// adminAuthorized reports whether the request carries a valid admin key header.
func adminAuthorized(r *http.Request) bool {
	return r.Header.Get("X-Admin-Key") == adminKey()
}

func CoursesHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query().Get("q")
	category := r.URL.Query().Get("category")
	priceType := r.URL.Query().Get("price") // "free", "paid", or ""

	// TC-10 Bug: extremely long keyword causes 500 error
	if len(q) > 200 {
		http.Error(w, "Internal Server Error: Query string too long. Database buffer overflow simulated.", http.StatusInternalServerError)
		return
	}

	db := database.DB

	// Category and price filters are applied in SQL (parameterized to stay
	// injection-safe). The keyword search is applied in Go afterwards so it can be
	// accent- and case-insensitive across Unicode, which SQLite's LIKE cannot do.
	queryStr := "SELECT id, title, description, instructor, price, category, rating, reviews_count, image_url FROM courses WHERE 1=1"
	var args []interface{}

	// BUG (Tìm kiếm): bộ lọc danh mục và mức giá đáng lẽ là hai điều kiện độc lập,
	// nhưng ở đây dùng else-if nên khi đã chọn danh mục thì bộ lọc giá bị bỏ qua.
	if category != "" {
		queryStr += " AND category = ?"
		args = append(args, category)
	} else if priceType == "free" {
		queryStr += " AND price = 0"
	} else if priceType == "paid" {
		queryStr += " AND price > 0"
	}

	rows, err := db.Query(queryStr, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Tokenize the keyword once. An empty raw query returns everything; a query that
	// is only whitespace yields zero tokens and is treated as "no match".
	tokens := strings.Fields(normalize(q))
	hasQuery := q != ""

	var courses []models.Course
	for rows.Next() {
		var c models.Course
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Instructor, &c.Price, &c.Category, &c.Rating, &c.ReviewsCount, &c.ImageURL)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if hasQuery {
			if len(tokens) == 0 {
				continue // whitespace-only query matches nothing
			}
			haystack := normalize(c.Title + " " + c.Description + " " + c.Instructor + " " + c.Category)
			if !matchesQuery(haystack, tokens) {
				continue
			}
		}

		courses = append(courses, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courses)
}

func CourseDetailHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// In Go 1.22+, r.PathValue("id") can get path parameter
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	db := database.DB

	var c models.Course
	err = db.QueryRow("SELECT id, title, description, instructor, price, category, rating, reviews_count, image_url FROM courses WHERE id = ?", id).
		Scan(&c.ID, &c.Title, &c.Description, &c.Instructor, &c.Price, &c.Category, &c.Rating, &c.ReviewsCount, &c.ImageURL)

	if err == sql.ErrNoRows {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch reviews
	rows, err := db.Query("SELECT id, course_id, user_email, rating, comment, created_at FROM reviews WHERE course_id = ? ORDER BY id DESC", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var rev models.Review
		err := rows.Scan(&rev.ID, &rev.CourseID, &rev.UserEmail, &rev.Rating, &rev.Comment, &rev.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		reviews = append(reviews, rev)
	}

	response := map[string]interface{}{
		"course":  c,
		"reviews": reviews,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func AddReviewHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	courseID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	userEmail := r.Header.Get("X-User-Email")
	if userEmail == "" {
		http.Error(w, "Unauthorized: Vui lòng đăng nhập trước khi đánh giá", http.StatusUnauthorized)
		return
	}

	var req struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TC-14: Star rating cannot be 0
	if req.Rating < 1 || req.Rating > 5 {
		http.Error(w, "Vui lòng chọn số sao từ 1 đến 5", http.StatusBadRequest)
		return
	}

	// TC-15: Min length check (only if comment is not empty, TC-13 allows empty comment)
	if req.Comment != "" && len(strings.TrimSpace(req.Comment)) < 3 {
		http.Error(w, "Bình luận phải có ít nhất 3 ký tự", http.StatusBadRequest)
		return
	}

	// TC-16: Max length check
	if len(req.Comment) > 500 {
		http.Error(w, "Bình luận không được vượt quá 500 ký tự", http.StatusBadRequest)
		return
	}

	db := database.DB

	// Check if already reviewed
	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM reviews WHERE course_id = ? AND user_email = ?)", courseID, userEmail).Scan(&exists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if exists {
		// TC-18 check
		http.Error(w, "Bạn đã đánh giá khóa học này rồi", http.StatusBadRequest)
		return
	}

	// TC-20 Bug: Delay database insert slightly to allow concurrent race condition when spam click
	time.Sleep(150 * time.Millisecond)

	_, err = db.Exec("INSERT INTO reviews (course_id, user_email, rating, comment) VALUES (?, ?, ?, ?)",
		courseID, userEmail, req.Rating, req.Comment)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Recalculate average ratings and reviews count
	_, err = db.Exec(`
		UPDATE courses 
		SET 
			rating = (SELECT IFNULL(AVG(rating), 0) FROM reviews WHERE reviews.course_id = courses.id),
			reviews_count = (SELECT COUNT(*) FROM reviews WHERE reviews.course_id = courses.id)
		WHERE id = ?
	`, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Đánh giá thành công"})
}

func RegisterCourseHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
		return
	}

	idStr := r.PathValue("id")
	courseID, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid course ID"})
		return
	}

	userEmail := r.Header.Get("X-User-Email")
	if userEmail == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"message": "Unauthorized: Vui lòng đăng nhập trước khi đăng ký"})
		return
	}

	var req struct {
		PaymentStatus string `json:"payment_status"` // "completed", "cancelled"
		Coupon        string `json:"coupon"`
	}

	_ = json.NewDecoder(r.Body).Decode(&req)

	db := database.DB

	// Check if course exists
	var price float64
	err = db.QueryRow("SELECT price FROM courses WHERE id = ?", courseID).Scan(&price)
	if err == sql.ErrNoRows {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"message": "Course not found"})
		return
	} else if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	// Check limit (TC-27: Maximum student limit of 2). Let's simulate a limit of 2 registrations for course ID 5 (Docker)
	if courseID == 5 {
		var regCount int
		_ = db.QueryRow("SELECT COUNT(*) FROM registrations WHERE course_id = ?", courseID).Scan(&regCount)
		if regCount >= 2 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Khóa học đã đầy học viên"})
			return
		}
	}

	// Check if already registered (TC-24)
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM registrations WHERE course_id = ? AND user_email = ?", courseID, userEmail).Scan(&count)
	if count > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"message": "Bạn đã đăng ký khóa học này rồi"})
		return
	}

	// Coupon code checks (TC-28, TC-29)
	var discount float64
	if req.Coupon != "" {
		if req.Coupon == "EXPIRED" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Mã giảm giá đã hết hạn"})
			return
		}
		// In real-world enterprise apps, active coupons are retrieved from database or cache.
		// For simulation, we define the current active promo campaigns.
		activeCoupons := map[string]float64{
			"GIAM20":  0.20,
			"GIAM50":  0.50,
			"FREE100": 1.00,
		}
		d, isValid := activeCoupons[req.Coupon]
		if !isValid {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Mã giảm giá không hợp lệ hoặc đã hết hạn"})
			return
		}
		discount = d
	}

	status := "completed"
	if price > 0 {
		// Paid course registration
		// We correctly process payment cancel state.
		if req.PaymentStatus == "cancelled" {
			status = "cancelled"
		} else if req.PaymentStatus == "completed" {
			status = "completed"
		} else {
			status = "pending"
		}
	}

	_, err = db.Exec("INSERT INTO registrations (course_id, user_email, status) VALUES (?, ?, ?)",
		courseID, userEmail, status)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	// BUG (Đăng ký): số tiền thực thu được tính trực tiếp bằng float và KHÔNG làm tròn
	// 2 chữ số thập phân, nên 49.99 * 0.8 = 39.992000000000004 sẽ lọt ra giao diện.
	charged := price * (1 - discount)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Đăng ký thành công",
		"status":  status,
		"amount":  charged,
	})
}

func MyCoursesHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userEmail := r.Header.Get("X-User-Email")
	if userEmail == "" {
		http.Error(w, "Unauthorized: Vui lòng đăng nhập", http.StatusUnauthorized)
		return
	}

	db := database.DB

	// BUG (Đăng ký): chỉ lấy đăng ký ở trạng thái 'completed'. Khóa trả phí đang chờ
	// xác nhận thanh toán ('pending') bị loại khỏi danh sách, khiến học viên đã đăng ký
	// nhưng không thấy khóa học của mình -> tưởng nhầm là đăng ký thất bại.
	rows, err := db.Query(`
		SELECT c.id, c.title, c.description, c.instructor, c.price, c.category, c.rating, c.reviews_count, c.image_url
		FROM courses c
		JOIN registrations r ON c.id = r.course_id
		WHERE r.user_email = ? AND r.status = 'completed'
	`, userEmail)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var courses []models.Course
	for rows.Next() {
		var c models.Course
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Instructor, &c.Price, &c.Category, &c.Rating, &c.ReviewsCount, &c.ImageURL)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		courses = append(courses, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courses)
}

func CancelCourseHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	courseID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	userEmail := r.Header.Get("X-User-Email")
	if userEmail == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	db := database.DB

	_, err = db.Exec("DELETE FROM registrations WHERE course_id = ? AND user_email = ?", courseID, userEmail)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Đã hủy đăng ký khóa học"})
}

func ResetHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	db := database.DB
	err := database.ResetDB(db, "./data/courses.db")
	if err != nil {
		http.Error(w, "Reset failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Database reset successfully"})
}

func ToggleWishlistHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.PathValue("id")
	courseID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	userEmail := r.Header.Get("X-User-Email")
	if userEmail == "" {
		http.Error(w, "Unauthorized: Vui lòng đăng nhập", http.StatusUnauthorized)
		return
	}

	db := database.DB

	// Check if already in wishlist
	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_email = ? AND course_id = ?)", userEmail, courseID).Scan(&exists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if exists {
		// Remove from wishlist
		_, err = db.Exec("DELETE FROM wishlist WHERE user_email = ? AND course_id = ?", userEmail, courseID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"action":  "removed",
			"message": "Đã xóa khỏi danh sách yêu thích",
		})
		return
	}

	// TC-40 Bug: Delay database insert slightly to allow concurrent race condition when spam click
	time.Sleep(150 * time.Millisecond)

	// Add to wishlist
	_, err = db.Exec("INSERT INTO wishlist (user_email, course_id) VALUES (?, ?)", userEmail, courseID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"action":  "added",
		"message": "Đã thêm vào danh sách yêu thích",
	})
}

// AdminStatsHandler returns aggregated data for the hidden /admin dashboard.
// It is intentionally reachable only by typing the URL (no navigation link in the UI).
func AdminStatsHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if !adminAuthorized(r) {
		http.Error(w, "Unauthorized: invalid admin key", http.StatusUnauthorized)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	db := database.DB

	var totalCourses, totalRegs, totalCompleted, totalReviews, totalWishlist int
	_ = db.QueryRow("SELECT COUNT(*) FROM courses").Scan(&totalCourses)
	_ = db.QueryRow("SELECT COUNT(*) FROM registrations").Scan(&totalRegs)
	_ = db.QueryRow("SELECT COUNT(*) FROM registrations WHERE status = 'completed'").Scan(&totalCompleted)
	_ = db.QueryRow("SELECT COUNT(*) FROM reviews").Scan(&totalReviews)
	_ = db.QueryRow("SELECT COUNT(*) FROM wishlist").Scan(&totalWishlist)

	var revenue float64
	_ = db.QueryRow(`
		SELECT IFNULL(SUM(c.price), 0)
		FROM registrations r JOIN courses c ON c.id = r.course_id
		WHERE r.status = 'completed'
	`).Scan(&revenue)

	// Per-course statistics (include full fields so the admin edit form is pre-filled)
	courseRows, err := db.Query(`
		SELECT c.id, c.title, c.description, c.instructor, c.category, c.price, c.rating, c.reviews_count, c.image_url,
			(SELECT COUNT(*) FROM registrations r WHERE r.course_id = c.id) AS reg_count,
			(SELECT COUNT(*) FROM registrations r WHERE r.course_id = c.id AND r.status = 'completed') AS completed_count
		FROM courses c
		ORDER BY c.id
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer courseRows.Close()

	courses := []map[string]interface{}{}
	for courseRows.Next() {
		var id, reviewsCount, regCount, completedCount int
		var title, description, instructor, category, imageURL string
		var price, rating float64
		if err := courseRows.Scan(&id, &title, &description, &instructor, &category, &price, &rating, &reviewsCount, &imageURL, &regCount, &completedCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		courses = append(courses, map[string]interface{}{
			"id":            id,
			"title":         title,
			"description":   description,
			"instructor":    instructor,
			"category":      category,
			"price":         price,
			"rating":        rating,
			"reviews_count": reviewsCount,
			"image_url":     imageURL,
			"registrations": regCount,
			"completed":     completedCount,
		})
	}

	// Recent registrations
	regRows, err := db.Query(`
		SELECT r.id, r.user_email, r.status, c.title
		FROM registrations r JOIN courses c ON c.id = r.course_id
		ORDER BY r.id DESC
		LIMIT 50
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer regRows.Close()

	registrations := []map[string]interface{}{}
	for regRows.Next() {
		var id int
		var userEmail, status, courseTitle string
		if err := regRows.Scan(&id, &userEmail, &status, &courseTitle); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		registrations = append(registrations, map[string]interface{}{
			"id":         id,
			"user_email": userEmail,
			"status":     status,
			"course":     courseTitle,
		})
	}

	// Recent reviews (for moderation)
	reviewRows, err := db.Query(`
		SELECT r.id, r.user_email, r.rating, r.comment, c.title
		FROM reviews r JOIN courses c ON c.id = r.course_id
		ORDER BY r.id DESC
		LIMIT 50
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer reviewRows.Close()

	reviews := []map[string]interface{}{}
	for reviewRows.Next() {
		var id, rating int
		var userEmail, comment, courseTitle string
		if err := reviewRows.Scan(&id, &userEmail, &rating, &comment, &courseTitle); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		reviews = append(reviews, map[string]interface{}{
			"id":         id,
			"user_email": userEmail,
			"rating":     rating,
			"comment":    comment,
			"course":     courseTitle,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"totals": map[string]interface{}{
			"courses":                 totalCourses,
			"registrations":           totalRegs,
			"completed_registrations": totalCompleted,
			"reviews":                 totalReviews,
			"wishlist":                totalWishlist,
			"revenue":                 revenue,
		},
		"courses":       courses,
		"registrations": registrations,
		"reviews":       reviews,
	})
}

// AdminCreateCourseHandler creates a new course. (POST /api/admin/courses)
func AdminCreateCourseHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if !adminAuthorized(r) {
		http.Error(w, "Unauthorized: invalid admin key", http.StatusUnauthorized)
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var c models.Course
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	c.Title = strings.TrimSpace(c.Title)
	c.Category = strings.TrimSpace(c.Category)
	if c.Title == "" || c.Category == "" {
		http.Error(w, "Tiêu đề và danh mục không được để trống", http.StatusBadRequest)
		return
	}
	if c.Price < 0 {
		http.Error(w, "Giá không hợp lệ", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(c.Instructor) == "" {
		c.Instructor = "Đang cập nhật"
	}
	if strings.TrimSpace(c.ImageURL) == "" {
		c.ImageURL = "/images/go.svg"
	}

	db := database.DB
	res, err := db.Exec(
		"INSERT INTO courses (title, description, instructor, price, category, rating, reviews_count, image_url) VALUES (?, ?, ?, ?, ?, 0, 0, ?)",
		c.Title, c.Description, c.Instructor, c.Price, c.Category, c.ImageURL,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := res.LastInsertId()
	c.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

// AdminUpdateCourseHandler updates an existing course. (PUT /api/admin/courses/{id})
func AdminUpdateCourseHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if !adminAuthorized(r) {
		http.Error(w, "Unauthorized: invalid admin key", http.StatusUnauthorized)
		return
	}
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	var c models.Course
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	c.Title = strings.TrimSpace(c.Title)
	c.Category = strings.TrimSpace(c.Category)
	if c.Title == "" || c.Category == "" {
		http.Error(w, "Tiêu đề và danh mục không được để trống", http.StatusBadRequest)
		return
	}
	if c.Price < 0 {
		http.Error(w, "Giá không hợp lệ", http.StatusBadRequest)
		return
	}

	db := database.DB
	// Keep the existing image if none was provided.
	if strings.TrimSpace(c.ImageURL) == "" {
		_ = db.QueryRow("SELECT image_url FROM courses WHERE id = ?", id).Scan(&c.ImageURL)
	}

	res, err := db.Exec(
		"UPDATE courses SET title = ?, description = ?, instructor = ?, price = ?, category = ?, image_url = ? WHERE id = ?",
		c.Title, c.Description, c.Instructor, c.Price, c.Category, c.ImageURL, id,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Đã cập nhật khóa học"})
}

// AdminDeleteCourseHandler deletes a course and all its related data. (DELETE /api/admin/courses/{id})
func AdminDeleteCourseHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if !adminAuthorized(r) {
		http.Error(w, "Unauthorized: invalid admin key", http.StatusUnauthorized)
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid course ID", http.StatusBadRequest)
		return
	}

	db := database.DB
	// SQLite has no cascade here, so remove dependents first to avoid orphan rows.
	_, _ = db.Exec("DELETE FROM wishlist WHERE course_id = ?", id)
	_, _ = db.Exec("DELETE FROM registrations WHERE course_id = ?", id)
	_, _ = db.Exec("DELETE FROM reviews WHERE course_id = ?", id)
	res, err := db.Exec("DELETE FROM courses WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "Course not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Đã xóa khóa học"})
}

// AdminDeleteReviewHandler removes a review and recalculates the course rating. (DELETE /api/admin/reviews/{id})
func AdminDeleteReviewHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if !adminAuthorized(r) {
		http.Error(w, "Unauthorized: invalid admin key", http.StatusUnauthorized)
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid review ID", http.StatusBadRequest)
		return
	}

	db := database.DB
	var courseID int
	if err := db.QueryRow("SELECT course_id FROM reviews WHERE id = ?", id).Scan(&courseID); err == sql.ErrNoRows {
		http.Error(w, "Review not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, err := db.Exec("DELETE FROM reviews WHERE id = ?", id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Recalculate average rating and review count for the affected course.
	_, _ = db.Exec(`
		UPDATE courses
		SET
			rating = (SELECT IFNULL(AVG(rating), 0) FROM reviews WHERE reviews.course_id = courses.id),
			reviews_count = (SELECT COUNT(*) FROM reviews WHERE reviews.course_id = courses.id)
		WHERE id = ?
	`, courseID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Đã xóa đánh giá"})
}

// AdminDeleteRegistrationHandler removes a registration record. (DELETE /api/admin/registrations/{id})
func AdminDeleteRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if !adminAuthorized(r) {
		http.Error(w, "Unauthorized: invalid admin key", http.StatusUnauthorized)
		return
	}
	if r.Method != "DELETE" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid registration ID", http.StatusBadRequest)
		return
	}

	db := database.DB
	res, err := db.Exec("DELETE FROM registrations WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "Registration not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Đã xóa đăng ký"})
}

func WishlistHandler(w http.ResponseWriter, r *http.Request) {
	EnableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userEmail := r.Header.Get("X-User-Email")
	if userEmail == "" {
		http.Error(w, "Unauthorized: Vui lòng đăng nhập", http.StatusUnauthorized)
		return
	}

	db := database.DB

	rows, err := db.Query(`
		SELECT c.id, c.title, c.description, c.instructor, c.price, c.category, c.rating, c.reviews_count, c.image_url 
		FROM courses c
		JOIN wishlist w ON c.id = w.course_id
		WHERE w.user_email = ?
	`, userEmail)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var courses []models.Course
	for rows.Next() {
		var c models.Course
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Instructor, &c.Price, &c.Category, &c.Rating, &c.ReviewsCount, &c.ImageURL)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		courses = append(courses, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courses)
}
