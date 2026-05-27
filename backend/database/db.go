package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"backend/models"
	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB(dbPath string) (*sql.DB, error) {
	// Create folder if not exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %v", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Create tables
	err = createTables(db)
	if err != nil {
		return nil, fmt.Errorf("failed to create tables: %v", err)
	}

	// Seed data if courses is empty
	err = SeedData(db)
	if err != nil {
		log.Printf("Seeding warning: %v", err)
	}

	DB = db
	return db, nil
}

func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS courses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			instructor TEXT NOT NULL,
			price REAL NOT NULL,
			category TEXT NOT NULL,
			rating REAL DEFAULT 0,
			reviews_count INTEGER DEFAULT 0,
			image_url TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS reviews (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			course_id INTEGER NOT NULL,
			user_email TEXT NOT NULL,
			rating INTEGER NOT NULL,
			comment TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(course_id) REFERENCES courses(id)
		);`,
		`CREATE TABLE IF NOT EXISTS registrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			course_id INTEGER NOT NULL,
			user_email TEXT NOT NULL,
			status TEXT NOT NULL,
			FOREIGN KEY(course_id) REFERENCES courses(id),
			UNIQUE(course_id, user_email)
		);`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func SeedData(db *sql.DB) error {
	// Check if already seeded
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM courses").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil // Already seeded
	}

	seedCourses := []models.Course{
		{
			Title:        "Golang Cơ Bản Cho Người Mới Bắt Đầu",
			Description:  "Học lập trình Go từ cơ bản đến xây dựng các ứng dụng CLI và Web API đầu tiên. Phù hợp cho lập trình viên mới bắt đầu hành trình backend.",
			Instructor:   "Nguyễn Văn A",
			Price:        0.0,
			Category:     "Go",
			ImageURL:     "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600&auto=format&fit=crop&q=60",
		},
		{
			Title:        "Lập trình Golang Nâng Cao & Microservices",
			Description:  "Xây dựng hệ thống microservices hiệu năng cao bằng Go, gRPC, Docker, Kafka và cấu trúc clean architecture.",
			Instructor:   "Trần Thị B",
			Price:        49.99,
			Category:     "Go",
			ImageURL:     "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60",
		},
		{
			Title:        "ReactJS Premium & Mastery",
			Description:  "Làm chủ React 18+, State Management, Hooks, Custom Hooks và triển khai dự án thực tế với hiệu năng tối ưu nhất.",
			Instructor:   "Phạm Văn C",
			Price:        29.99,
			Category:     "Frontend",
			ImageURL:     "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=60",
		},
		{
			Title:        "CSS & Design System Cho Lập Trình Viên",
			Description:  "Tự thiết kế giao diện UI/UX đẹp mắt, xây dựng hệ thống CSS Variables, Responsive Design và Animation cao cấp mà không cần Tailwind.",
			Instructor:   "Lê Thị D",
			Price:        0.0,
			Category:     "Frontend",
			ImageURL:     "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=60",
		},
		{
			Title:        "Docker & Kubernetes Từ Zero Đến Hero",
			Description:  "Học cách đóng gói ứng dụng, triển khai CI/CD và quản lý hạ tầng container Kubernetes một cách chuyên nghiệp.",
			Instructor:   "Hoàng Văn E",
			Price:        79.99,
			Category:     "DevOps",
			ImageURL:     "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60",
		},
		{
			Title:        "Xây Dựng SaaS Fullstack Với Next.js 14",
			Description:  "Phát triển ứng dụng Web SaaS thương mại hóa với Next.js App Router, Prisma, PostgreSQL và tích hợp Stripe thanh toán.",
			Instructor:   "Vũ Thị F",
			Price:        59.99,
			Category:     "Frontend",
			ImageURL:     "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60",
		},
	}

	for _, c := range seedCourses {
		_, err := db.Exec(
			"INSERT INTO courses (title, description, instructor, price, category, rating, reviews_count, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			c.Title, c.Description, c.Instructor, c.Price, c.Category, 0.0, 0, c.ImageURL,
		)
		if err != nil {
			return err
		}
	}

	// Also seed some initial reviews to look professional
	initialReviews := []models.Review{
		{CourseID: 1, UserEmail: "student1@gmail.com", Rating: 5, Comment: "Khóa học rất hay, giải thích dễ hiểu!"},
		{CourseID: 1, UserEmail: "student2@gmail.com", Rating: 4, Comment: "Tốt cho người mới, mong có thêm bài tập."},
		{CourseID: 2, UserEmail: "student3@gmail.com", Rating: 5, Comment: "Kiến thức thực tế sâu sắc. Rất đáng tiền!"},
		{CourseID: 3, UserEmail: "student1@gmail.com", Rating: 5, Comment: "Giảng viên dạy nhiệt tình, code chạy mượt."},
	}

	for _, r := range initialReviews {
		_, err := db.Exec(
			"INSERT INTO reviews (course_id, user_email, rating, comment) VALUES (?, ?, ?, ?)",
			r.CourseID, r.UserEmail, r.Rating, r.Comment,
		)
		if err != nil {
			return err
		}
	}

	// Recalculate average ratings and review counts
	_, err = db.Exec(`
		UPDATE courses 
		SET 
			rating = (SELECT IFNULL(AVG(rating), 0) FROM reviews WHERE reviews.course_id = courses.id),
			reviews_count = (SELECT COUNT(*) FROM reviews WHERE reviews.course_id = courses.id)
	`)
	return err
}

func ResetDB(db *sql.DB, dbPath string) error {
	// Drop tables
	_, _ = db.Exec("DROP TABLE IF EXISTS registrations")
	_, _ = db.Exec("DROP TABLE IF EXISTS reviews")
	_, _ = db.Exec("DROP TABLE IF EXISTS courses")

	err := createTables(db)
	if err != nil {
		return err
	}

	return SeedData(db)
}
