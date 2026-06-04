package main

import (
	"log"
	"net/http"
	"os"

	"backend/database"
	"backend/handlers"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/courses.db"
	}

	_, err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer database.DB.Close()

	mux := http.NewServeMux()

	// Register API endpoints
	mux.HandleFunc("GET /api/courses", handlers.CoursesHandler)
	mux.HandleFunc("OPTIONS /api/courses", handlers.CoursesHandler)

	mux.HandleFunc("GET /api/courses/{id}", handlers.CourseDetailHandler)
	mux.HandleFunc("OPTIONS /api/courses/{id}", handlers.CourseDetailHandler)

	mux.HandleFunc("POST /api/courses/{id}/reviews", handlers.AddReviewHandler)
	mux.HandleFunc("OPTIONS /api/courses/{id}/reviews", handlers.AddReviewHandler)

	mux.HandleFunc("POST /api/courses/{id}/register", handlers.RegisterCourseHandler)
	mux.HandleFunc("OPTIONS /api/courses/{id}/register", handlers.RegisterCourseHandler)

	mux.HandleFunc("GET /api/my-courses", handlers.MyCoursesHandler)
	mux.HandleFunc("OPTIONS /api/my-courses", handlers.MyCoursesHandler)

	mux.HandleFunc("POST /api/courses/{id}/cancel", handlers.CancelCourseHandler)
	mux.HandleFunc("OPTIONS /api/courses/{id}/cancel", handlers.CancelCourseHandler)

	mux.HandleFunc("POST /api/courses/{id}/wishlist", handlers.ToggleWishlistHandler)
	mux.HandleFunc("OPTIONS /api/courses/{id}/wishlist", handlers.ToggleWishlistHandler)

	mux.HandleFunc("GET /api/wishlist", handlers.WishlistHandler)
	mux.HandleFunc("OPTIONS /api/wishlist", handlers.WishlistHandler)

	mux.HandleFunc("POST /api/reset", handlers.ResetHandler)
	mux.HandleFunc("OPTIONS /api/reset", handlers.ResetHandler)

	mux.HandleFunc("GET /api/admin/stats", handlers.AdminStatsHandler)
	mux.HandleFunc("OPTIONS /api/admin/stats", handlers.AdminStatsHandler)

	mux.HandleFunc("POST /api/admin/courses", handlers.AdminCreateCourseHandler)
	mux.HandleFunc("OPTIONS /api/admin/courses", handlers.AdminCreateCourseHandler)

	mux.HandleFunc("PUT /api/admin/courses/{id}", handlers.AdminUpdateCourseHandler)
	mux.HandleFunc("DELETE /api/admin/courses/{id}", handlers.AdminDeleteCourseHandler)
	mux.HandleFunc("OPTIONS /api/admin/courses/{id}", handlers.AdminDeleteCourseHandler)

	mux.HandleFunc("DELETE /api/admin/reviews/{id}", handlers.AdminDeleteReviewHandler)
	mux.HandleFunc("OPTIONS /api/admin/reviews/{id}", handlers.AdminDeleteReviewHandler)

	mux.HandleFunc("DELETE /api/admin/registrations/{id}", handlers.AdminDeleteRegistrationHandler)
	mux.HandleFunc("OPTIONS /api/admin/registrations/{id}", handlers.AdminDeleteRegistrationHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
