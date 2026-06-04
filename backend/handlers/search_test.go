package handlers

import (
	"strings"
	"testing"
)

// seed text mirrors database.SeedData so we can validate search behavior offline.
var seed = []struct{ title, desc, instr, cat string }{
	{"Golang Cơ Bản Cho Người Mới Bắt Đầu", "Học lập trình Go từ cơ bản đến xây dựng các ứng dụng CLI và Web API đầu tiên.", "Nguyễn Văn A", "Go"},
	{"Lập trình Golang Nâng Cao & Microservices", "Xây dựng hệ thống microservices hiệu năng cao bằng Go, gRPC, Docker, Kafka.", "Trần Thị B", "Go"},
	{"ReactJS Premium & Mastery", "Làm chủ React 18+, State Management, Hooks, Custom Hooks và triển khai dự án.", "Phạm Văn C", "Frontend"},
	{"CSS & Design System Cho Lập Trình Viên", "Tự thiết kế giao diện UI/UX đẹp mắt, Responsive Design và Animation.", "Lê Thị D", "Frontend"},
	{"Docker & Kubernetes Từ Zero Đến Hero", "Học cách đóng gói ứng dụng, triển khai CI/CD và quản lý hạ tầng container Kubernetes.", "Hoàng Văn E", "DevOps"},
	{"Xây Dựng SaaS Fullstack Với Next.js 14", "Phát triển ứng dụng Web SaaS với Next.js App Router, Prisma, PostgreSQL.", "Vũ Thị F", "Frontend"},
}

func countMatches(q string) int {
	tokens := strings.Fields(normalize(q))
	if q == "" {
		return len(seed)
	}
	if len(tokens) == 0 {
		return 0
	}
	n := 0
	for _, c := range seed {
		h := normalize(c.title + " " + c.desc + " " + c.instr + " " + c.cat)
		if matchesQuery(h, tokens) {
			n++
		}
	}
	return n
}

func TestSearch(t *testing.T) {
	cases := []struct {
		q    string
		want int
	}{
		{"Cơ Bản", 1},   // TC-01
		{"co ban", 1},   // accent-insensitive
		{"golang", 2},   // TC-02 lower
		{"GOLANG", 2},   // TC-02 upper
		{"react hooks", 1}, // multi-word order-independent (title + desc)
		{"", 6},         // TC-04 empty -> all
		{"   ", 0},      // TC-05 whitespace only
		{"' OR '1'='1", 0},               // TC-06
		{"'; DROP TABLE reviews; --", 0}, // TC-06
		{"Python Django Machine Learning", 0}, // TC-03
	}
	for _, tc := range cases {
		if got := countMatches(tc.q); got != tc.want {
			t.Errorf("q=%q got %d want %d", tc.q, got, tc.want)
		}
	}
}
