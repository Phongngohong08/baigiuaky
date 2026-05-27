package models

type Course struct {
	ID           int      `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Instructor   string   `json:"instructor"`
	Price        float64  `json:"price"` // 0 means Free
	Category     string   `json:"category"`
	Rating       float64  `json:"rating"` // Average rating
	ReviewsCount int      `json:"reviews_count"`
	ImageURL     string   `json:"image_url"`
}

type Review struct {
	ID        int    `json:"id"`
	CourseID  int    `json:"course_id"`
	UserEmail string `json:"user_email"`
	Rating    int    `json:"rating"`
	Comment   string `json:"comment"`
	CreatedAt string `json:"created_at"`
}

type Registration struct {
	ID        int    `json:"id"`
	CourseID  int    `json:"course_id"`
	UserEmail string `json:"user_email"`
	Status    string `json:"status"` // "completed" or "pending"
}
