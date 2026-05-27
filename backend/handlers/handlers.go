package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/database"
	"backend/models"
)

func EnableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Email, Authorization")
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

	// Build query
	queryStr := "SELECT id, title, description, instructor, price, category, rating, reviews_count, image_url FROM courses WHERE 1=1"
	var args []interface{}

	if q != "" {
		queryStr += " AND (title LIKE ? OR description LIKE ?)"
		args = append(args, "%"+q+"%", "%"+q+"%")
	}

	if category != "" {
		queryStr += " AND category = ?"
		args = append(args, category)
	}

	if priceType == "free" {
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
	if req.Coupon != "" {
		if req.Coupon == "EXPIRED" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Mã giảm giá đã hết hạn"})
			return
		}
		if req.Coupon != "GIAM50" && req.Coupon != "FREE100" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Mã giảm giá không hợp lệ"})
			return
		}
	}

	status := "completed"
	if price > 0 {
		// Paid course registration
		// TC-30 Bug: Backend accepts registration even if payment is cancelled!
		if req.PaymentStatus == "cancelled" {
			// Bug: Instead of rejecting, we save it as "completed" anyway!
			status = "completed"
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Đăng ký thành công",
		"status":  status,
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
