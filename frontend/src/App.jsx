import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  Star, 
  User, 
  LogOut, 
  DollarSign, 
  Layers, 
  Clock, 
  CheckCircle, 
  X, 
  Sparkles, 
  AlertCircle,
  CreditCard,
  Heart,
  Play,
  Pause,
  Volume2,
  RotateCcw,
  Send
} from 'lucide-react';

const COURSE_LESSONS = {
  1: [
    {
      title: "Bài 1: Giới thiệu Golang & Cài đặt môi trường học tập",
      duration: "10:15",
      content: "Tìm hiểu nguồn gốc của Golang, tại sao các tập đoàn công nghệ lớn tin dùng. Hướng dẫn tải và cài đặt Go SDK bản mới nhất, cấu hình biến môi trường PATH và cài đặt VS Code với Go Extension.",
      exercise: "Cài đặt Go thành công trên máy cá nhân, chạy lệnh 'go version' trong terminal và dán kết quả phiên bản Go bạn vừa cài đặt."
    },
    {
      title: "Bài 2: Cú pháp cơ bản, Biến, Kiểu dữ liệu & Con trỏ trong Go",
      duration: "15:30",
      content: "Học cách khai báo biến bằng var, const và toán tử gán nhanh :=. Phân biệt các kiểu dữ liệu cơ bản (string, int, bool, float) và tìm hiểu cơ chế hoạt động của con trỏ (pointer) để quản lý ô nhớ.",
      exercise: "Viết chương trình tráo đổi giá trị của 2 biến số nguyên a và b sử dụng tham chiếu con trỏ."
    },
    {
      title: "Bài 3: Điều khiển luồng: Câu lệnh điều kiện if-else & Vòng lặp for",
      duration: "12:45",
      content: "Làm chủ cấu trúc rẽ nhánh if-else, câu lệnh switch-case tối ưu và vòng lặp duy nhất trong Go: vòng lặp for (bao gồm for truyền thống, for-range và mô phỏng while).",
      exercise: "Viết vòng lặp for in ra các số lẻ từ 1 đến 20, bỏ qua số 13 sử dụng từ khóa 'continue'."
    },
    {
      title: "Bài 4: Cấu trúc dữ liệu: Array, Slice, Map & Struct",
      duration: "18:20",
      content: "Tìm hiểu cách lưu trữ tập hợp dữ liệu bằng Array cố định kích thước, Slice linh hoạt động, Map dạng key-value và định nghĩa đối tượng dữ liệu tùy chỉnh bằng Struct.",
      exercise: "Định nghĩa struct Student gồm Name (string) và Grade (float). Tạo một map lưu danh sách Student theo ID kiểu string."
    },
    {
      title: "Bài 5: Định nghĩa hàm, Method và Interface cơ bản",
      duration: "14:10",
      content: "Cách viết hàm nhận nhiều tham số và trả về nhiều giá trị. Gắn hàm vào Struct (Method) và định nghĩa giao ước Interface để viết code hướng đối tượng theo phong cách Go.",
      exercise: "Viết interface Shape có method Area() float64. Định nghĩa struct Circle và triển khai method Area() tính diện tích hình tròn."
    },
    {
      title: "Bài 6: Thực hành: Xây dựng ứng dụng CLI quản lý tác vụ",
      duration: "25:40",
      content: "Kết hợp toàn bộ kiến thức để xây dựng một ứng dụng dòng lệnh (CLI Todo App) cho phép thêm, sửa, xóa và hiển thị danh sách công việc cần làm, ghi vào file văn bản.",
      exercise: "Mở rộng Todo App thêm tính năng đánh dấu công việc đã hoàn thành (Done) và lọc các tác vụ chưa làm."
    }
  ],
  2: [
    {
      title: "Bài 1: Concurrency nâng cao: Goroutines, Channels & Select",
      duration: "18:30",
      content: "Đi sâu vào cơ chế xử lý đồng thời cực mạnh của Go. Học cách chạy hàm song song với Goroutine siêu nhẹ, truyền tin an toàn qua Channel và lắng nghe nhiều kênh với Select.",
      exercise: "Viết chương trình dùng channel để gửi kết quả tính bình phương từ goroutine con về hàm main."
    },
    {
      title: "Bài 2: Đồng bộ hóa tiến trình: Mutex, WaitGroup & Context",
      duration: "16:15",
      content: "Quản lý tranh chấp tài nguyên (Race Condition) bằng Mutex, đồng bộ hóa các luồng chạy với WaitGroup và kiểm soát vòng đời, thời gian chờ của tiến trình qua Context.",
      exercise: "Sử dụng sync.Mutex để giải quyết bài toán tăng biến đếm toàn cục an toàn từ 1000 goroutine chạy song song."
    },
    {
      title: "Bài 3: Thiết kế API RESTful chuẩn chính với Clean Architecture",
      duration: "22:10",
      content: "Thiết kế cấu trúc dự án chuẩn doanh nghiệp, chia lớp rõ ràng (Domain, Repository, Usecase, Delivery) giúp code dễ bảo trì, dễ viết unit test.",
      exercise: "Phác thảo cấu trúc thư mục dự án Go REST API theo Clean Architecture."
    },
    {
      title: "Bài 4: Xây dựng hệ thống Microservices sử dụng gRPC & Protocol Buffers",
      duration: "20:45",
      content: "Tìm hiểu kiến trúc Microservice, giao tiếp hiệu năng cao giữa các service thông qua gRPC protocol và tối ưu payload với Protocol Buffers.",
      exercise: "Viết một tệp protobuf định nghĩa service User với method GetUserProfile."
    },
    {
      title: "Bài 5: Message Broker: Kết nối hệ thống với Apache Kafka / RabbitMQ",
      duration: "24:30",
      content: "Ứng dụng cơ chế bất đồng bộ cho hệ thống lớn. Cách tích hợp Kafka/RabbitMQ để truyền nhận message giữa các microservice độc lập.",
      exercise: "Viết hàm Producer gửi sự kiện 'user_registered' lên một Kafka topic giả lập."
    },
    {
      title: "Bài 6: Thực hành: Xây dựng hệ thống Payment Gateway chịu tải lớn",
      duration: "30:00",
      content: "Tích hợp và xây dựng cổng thanh toán trực tuyến mô phỏng, xử lý giao dịch đồng thời lớn, đảm bảo tính nhất quán dữ liệu (Transaction) và hạn chế lỗi double-spending.",
      exercise: "Viết code xử lý kiểm tra số dư và trừ tiền tài khoản an toàn trong cơ sở dữ liệu."
    }
  ],
  3: [
    {
      title: "Bài 1: Ôn tập cơ chế render của React & React Virtual DOM",
      duration: "11:20",
      content: "Hiểu rõ cách React quản lý cây DOM ảo (Virtual DOM), cơ chế so khớp (Reconciliation) và giải thuật Diffing để cập nhật giao diện một cách tối ưu.",
      exercise: "Giải thích tại sao việc dùng index làm 'key' khi render list trong React lại có thể gây lỗi UI."
    },
    {
      title: "Bài 2: Deep-dive React Hooks: useEffect, useMemo, useCallback",
      duration: "15:45",
      content: "Làm chủ cơ chế hoạt động của useEffect cleanup function, tối ưu hóa tính toán nặng với useMemo và tránh tạo lại hàm thừa thãi với useCallback.",
      exercise: "Viết một component sử dụng useCallback để truyền callback function xuống component con mà không bị re-render không cần thiết."
    },
    {
      title: "Bài 3: Xây dựng Custom Hooks chuyên nghiệp để tái sử dụng logic",
      duration: "14:50",
      content: "Học cách trích xuất logic trạng thái phức tạp ra ngoài component thành các custom hooks như useFetch, useLocalStorage, useDebounce tái sử dụng linh hoạt.",
      exercise: "Tự viết custom hook 'useLocalStorage(key, initialValue)' để đồng bộ state với LocalStorage."
    },
    {
      title: "Bài 4: State Management: Quản lý state toàn cục với Zustand & Redux Toolkit",
      duration: "21:15",
      content: "So sánh các mô hình quản lý state toàn cục. Hướng dẫn tích hợp thư viện nhẹ nhàng Zustand và thư viện chuẩn công nghiệp Redux Toolkit.",
      exercise: "Cấu hình một store Zustand đơn giản để quản lý trạng thái đăng nhập và giỏ hàng của ứng dụng."
    },
    {
      title: "Bài 5: Tối ưu hóa hiệu năng render & Lazy Loading Components",
      duration: "17:30",
      content: "Sử dụng React.lazy và Suspense để phân tách code (code-splitting). Áp dụng React.memo để ngăn chặn re-render không đáng có cho component tĩnh.",
      exercise: "Sử dụng React.lazy để tải chậm một modal chi tiết sản phẩm nặng."
    },
    {
      title: "Bài 6: Thực hành: Viết bộ thư viện UI Kit có hỗ trợ Dark Mode",
      duration: "28:10",
      content: "Xây dựng các component nền tảng (Button, Card, Input) có tính tùy biến cao, hỗ trợ chuyển đổi giao diện sáng/tối (Dark/Light mode) mượt mà.",
      exercise: "Thiết kế component Button nhận các props size, variant (primary, secondary) có hỗ trợ CSS variables cho Dark Mode."
    }
  ],
  4: [
    {
      title: "Bài 1: Làm chủ Flexbox & Grid trong các bố cục phức tạp",
      duration: "12:00",
      content: "Nắm vững các thuộc tính căn chỉnh nâng cao của CSS Flexbox (align-items, justify-content, flex-grow) và chia lưới đa chiều phức tạp bằng Grid Layout.",
      exercise: "Xây dựng bố cục 3 cột (Holy Grail Layout) sử dụng Grid Layout đáp ứng tốt trên mọi thiết bị."
    },
    {
      title: "Bài 2: Xây dựng Design System chuyên nghiệp bằng CSS Variables",
      duration: "14:15",
      content: "Thiết lập hệ thống màu sắc, kiểu chữ, khoảng cách thống nhất bằng CSS Custom Properties. Dễ dàng bảo trì và đổi chủ đề toàn trang.",
      exercise: "Khai báo bộ biến CSS cho bảng màu chính gồm primary, secondary, danger, warning ở root."
    },
    {
      title: "Bài 3: Thiết kế Responsive nâng cao cho mọi loại màn hình",
      duration: "15:00",
      content: "Sử dụng Media Queries đúng chuẩn, thiết lập breakpoint thông minh và làm việc với các đơn vị tương đối (em, rem, vh, vw, clamp).",
      exercise: "Sử dụng hàm clamp() của CSS để tạo font-size co giãn mượt mà từ màn hình Mobile đến Desktop mà không cần Media Queries."
    },
    {
      title: "Bài 4: Tạo hiệu ứng động: CSS Keyframe Animations & Transitions",
      duration: "16:20",
      content: "Học cách tạo ra các chuyển động mượt mà (transitions) và các hoạt ảnh tùy chỉnh phức tạp (@keyframes) giúp tăng trải nghiệm người dùng tương tác.",
      exercise: "Tạo hiệu ứng nút bấm nảy nhẹ (pulse animation) liên tục bằng CSS @keyframes."
    },
    {
      title: "Bài 5: Xu hướng thiết kế hiện đại: Glassmorphism & Claymorphism",
      duration: "11:45",
      content: "Kỹ thuật tạo giao diện kính mờ sang trọng bằng backdrop-filter và box-shadow đa lớp. Tạo hiệu ứng đất sét 3D mềm mại.",
      exercise: "Thiết kế một thẻ Card có hiệu ứng kính mờ (Glassmorphism) trên nền gradient nhiều màu sắc."
    },
    {
      title: "Bài 6: Thực hành: Thiết kế trang Landing Page có hiệu ứng Parallax",
      duration: "26:30",
      content: "Ứng dụng toàn bộ kiến thức CSS nâng cao để tạo một trang đích (Landing Page) giới thiệu sản phẩm có hiệu ứng cuộn trang Parallax sống động.",
      exercise: "Tạo cấu trúc HTML/CSS cuộn nhiều lớp hình nền với tốc độ khác nhau tạo hiệu ứng 3D chiều sâu."
    }
  ],
  5: [
    {
      title: "Bài 1: Hiểu sâu về Containerization và kiến trúc Docker Engine",
      duration: "14:50",
      content: "Phân biệt ảo hóa máy ảo (VM) và ảo hóa container. Kiến trúc Docker Engine gồm Client, Host và Registry. Cách hoạt động của Namespace và Cgroups.",
      exercise: "Giải thích ngắn gọn sự khác nhau về dung lượng và tốc độ khởi động giữa Container và Virtual Machine."
    },
    {
      title: "Bài 2: Viết Dockerfile chuẩn production để tối ưu hóa dung lượng image",
      duration: "17:15",
      content: "Cách viết Dockerfile, các lệnh cơ bản (FROM, RUN, COPY, CMD). Kỹ thuật Multi-stage build để giảm dung lượng file ảnh xuống tối thiểu cho môi trường sản phẩm.",
      exercise: "Viết Dockerfile hai giai đoạn (multi-stage) để build và đóng gói một ứng dụng Go/Node.js."
    },
    {
      title: "Bài 3: Quản lý Network và Volume lưu trữ trong Docker",
      duration: "15:40",
      content: "Tìm hiểu cách các container giao tiếp qua Bridge, Host, Overlay networks. Sử dụng Volume và Bind Mount để lưu trữ dữ liệu bền vững ngoài vòng đời container.",
      exercise: "Chạy một container PostgreSQL và gán volume để dữ liệu không bị mất đi khi container bị restart."
    },
    {
      title: "Bài 4: Điều phối đa container với Docker Compose nâng cao",
      duration: "18:20",
      content: "Viết tệp docker-compose.yml để định nghĩa hệ thống gồm App, DB và Cache. Quản lý biến môi trường, mối quan hệ dependencies (depends_on).",
      exercise: "Thiết lập docker-compose chạy đồng thời ứng dụng Web React và API Node.js kết nối chung một mạng ảo."
    },
    {
      title: "Bài 5: Khởi đầu với Kubernetes: Pod, Service, ReplicaSet & Deployment",
      duration: "22:30",
      content: "Giới thiệu hệ điều hành đám mây Kubernetes. Tìm hiểu thành phần cơ bản: Pod chạy container, ReplicaSet quản lý số lượng bản sao, Service định tuyến lưu lượng.",
      exercise: "Viết tệp YAML định nghĩa Deployment cho ứng dụng web với số lượng 3 replicas."
    },
    {
      title: "Bài 6: Thực hành: Viết CI/CD pipeline tự động build và deploy lên K8s Cluster",
      duration: "32:00",
      content: "Xây dựng quy trình tự động hóa tích hợp và triển khai liên tục (CI/CD) bằng GitHub Actions. Tự động build Docker Image, push lên Registry và cập nhật K8s Cluster.",
      exercise: "Viết tệp cấu hình Github Action (.yml) kích hoạt khi push code mới để chạy test tự động."
    }
  ],
  6: [
    {
      title: "Bài 1: Next.js App Router: Server Components vs Client Components",
      duration: "15:30",
      content: "Làm chủ mô hình render mới của Next.js 14. Hiểu khi nào sử dụng Server Components để tối ưu SEO, tốc độ tải và khi nào sử dụng Client Components cho tương tác người dùng.",
      exercise: "Viết một component lấy dữ liệu từ API trực tiếp trên Server (Server Component) bằng hàm fetch bất đồng bộ."
    },
    {
      title: "Bài 2: Routing nâng cao, Parallel Routes & Intercepting Routes",
      duration: "16:45",
      content: "Tận dụng hệ thống định tuyến dựa trên thư mục của Next.js. Tạo layout lồng nhau, định tuyến song song và chặn luồng điều hướng để tạo trải nghiệm modal mượt mà.",
      exercise: "Tạo cấu trúc thư mục định nghĩa dynamic route `/products/[id]` hiển thị chi tiết sản phẩm."
    },
    {
      title: "Bài 3: Server Actions: Giao tiếp dữ liệu không cần API endpoints",
      duration: "18:20",
      content: "Sử dụng Server Actions để gọi trực tiếp các hàm chạy trên server từ component client thông qua biểu mẫu Form. Tự động bảo mật và tích hợp CSRF protection.",
      exercise: "Viết một Form đăng ký bản tin sử dụng Server Action để thêm email vào cơ sở dữ liệu."
    },
    {
      title: "Bài 4: Tích hợp ORM Prisma, Postgres & Thiết kế DB Schema",
      duration: "20:50",
      content: "Kết nối Next.js với cơ sở dữ liệu PostgreSQL thông qua Prisma ORM. Thiết kế mô hình cơ sở dữ liệu quan hệ (1-n, n-n) và chạy lệnh migration.",
      exercise: "Định nghĩa Prisma Schema gồm model User và Post với quan hệ một-nhiều (One-to-Many)."
    },
    {
      title: "Bài 5: Tích hợp Stripe Payment: Cấu hình Webhook & Stripe Checkout",
      duration: "25:00",
      content: "Quy trình thanh toán trực tuyến an toàn. Tích hợp cổng thanh toán Stripe Checkout, cấu hình Stripe Webhook để lắng nghe sự kiện thanh toán thành công và cập nhật DB.",
      exercise: "Giải thích vai trò của Webhook trong Stripe Payment và tại sao không nên cập nhật trạng thái đơn hàng trực tiếp từ Client."
    },
    {
      title: "Bài 6: Thực hành: Deploy dự án SaaS hoàn chỉnh lên Vercel & Supabase",
      duration: "30:00",
      content: "Đóng gói toàn bộ ứng dụng SaaS thương mại hóa. Triển khai frontend Next.js lên nền tảng đám mây Vercel và cấu hình cơ sở dữ liệu đám mây Supabase Postgres.",
      exercise: "Thực hiện cấu hình các biến môi trường Production (DATABASE_URL, STRIPE_SECRET_KEY) trên trang quản lý Vercel."
    }
  ]
};

export default function App() {
  // Authentication
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loginInput, setLoginInput] = useState(''); // email
  const [loginPassword, setLoginPassword] = useState('123456'); // Default to '123456' for test runner compatibility
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Course & Details
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(''); // "", "free", "paid"

  // Active Tab
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'my-courses'

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false); // Used internally, but we will deliberately bypass disabling the button for TC-20 spam test!

  // Checkout / Registration
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // decimal e.g. 0.5 for 50%
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Toast notifications
  const [toast, setToast] = useState(null);
  const [globalError, setGlobalError] = useState('');

  // Course Learning Hub State
  const [activeLessonIndex, setActiveLessonIndex] = useState(null); // lesson index (0-5) or null for overview
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // in seconds
  const [homeworkAnswer, setHomeworkAnswer] = useState('');
  const [homeworkSubmitted, setHomeworkSubmitted] = useState({}); // key: course_id-lesson_idx
  const [completedLessons, setCompletedLessons] = useState({}); // key: course_id

  // Load completed lessons & homework from localStorage
  useEffect(() => {
    if (userEmail && selectedCourse) {
      const key = `techacademy_completed_${userEmail}_${selectedCourse.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCompletedLessons(prev => ({
            ...prev,
            [selectedCourse.id]: parsed
          }));
        } catch (e) {
          console.error(e);
        }
      } else {
        setCompletedLessons(prev => ({
          ...prev,
          [selectedCourse.id]: []
        }));
      }

      const hwKey = `techacademy_hw_${userEmail}_${selectedCourse.id}`;
      const savedHw = localStorage.getItem(hwKey);
      if (savedHw) {
        try {
          const parsed = JSON.parse(savedHw);
          setHomeworkSubmitted(prev => ({
            ...prev,
            ...parsed
          }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [userEmail, selectedCourse]);

  // Simulated Video Player Timer Effect
  useEffect(() => {
    let interval = null;
    if (isVideoPlaying && selectedCourse && activeLessonIndex !== null) {
      const lessons = COURSE_LESSONS[selectedCourse.id] || [];
      const lesson = lessons[activeLessonIndex];
      if (lesson) {
        const parts = lesson.duration.split(':');
        const maxSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        
        interval = setInterval(() => {
          setVideoProgress(prev => {
            if (prev >= maxSeconds) {
              setIsVideoPlaying(false);
              return 0; // Reset at completion
            }
            return prev + 1;
          });
        }, 1000);
      }
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying, selectedCourse, activeLessonIndex]);

  // Toggle lesson completion status
  const handleToggleLessonCompleted = (courseId, lessonIdx) => {
    if (!userEmail) return;
    const currentCompleted = completedLessons[courseId] || [];
    let newCompleted;
    if (currentCompleted.includes(lessonIdx)) {
      newCompleted = currentCompleted.filter(idx => idx !== lessonIdx);
    } else {
      newCompleted = [...currentCompleted, lessonIdx];
    }

    setCompletedLessons(prev => ({
      ...prev,
      [courseId]: newCompleted
    }));

    const key = `techacademy_completed_${userEmail}_${courseId}`;
    localStorage.setItem(key, JSON.stringify(newCompleted));
    showToast(currentCompleted.includes(lessonIdx) ? 'Đã hủy đánh dấu hoàn thành bài học' : 'Đã đánh dấu hoàn thành bài học!');
  };

  // Submit homework
  const handleSubmitHomework = (courseId, lessonIdx) => {
    if (!homeworkAnswer.trim()) {
      showToast('Vui lòng nhập câu trả lời bài tập', 'error');
      return;
    }

    const submissionKey = `${courseId}-${lessonIdx}`;
    const newSubmissions = {
      ...homeworkSubmitted,
      [submissionKey]: true
    };
    setHomeworkSubmitted(newSubmissions);

    const key = `techacademy_hw_${userEmail}_${courseId}`;
    const saved = localStorage.getItem(key);
    let currentHw = {};
    if (saved) {
      try { currentHw = JSON.parse(saved); } catch(e){}
    }
    currentHw[submissionKey] = true;
    localStorage.setItem(key, JSON.stringify(currentHw));

    showToast('Nộp bài tập thành công! Giảng viên sẽ chấm bài và phản hồi sớm.');
    setHomeworkAnswer('');
  };

  const handleSelectLesson = (idx) => {
    setActiveLessonIndex(idx);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    setHomeworkAnswer('');
  };

  // Fetch all courses based on search & filter
  const fetchCourses = async () => {
    try {
      setGlobalError('');
      let url = `/api/courses?q=${encodeURIComponent(searchQuery)}&category=${categoryFilter}&price=${priceFilter}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(await res.text() || 'Lỗi khi tải danh sách khóa học');
      }
      const data = await res.json();
      setCourses(data || []);
    } catch (err) {
      console.error(err);
      setCourses([]);
      setGlobalError(err.message);
      showToast(err.message, 'error');
    }
  };

  // Fetch current user's registered courses
  const fetchMyCourses = async () => {
    if (!userEmail) {
      setMyCourses([]);
      return;
    }
    try {
      const res = await fetch('/api/my-courses', {
        headers: { 'X-User-Email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setMyCourses(data || []);
      }
    } catch (err) {
      console.error('Error fetching registered courses:', err);
    }
  };

  // Fetch current user's wishlist
  const fetchWishlist = async () => {
    if (!userEmail) {
      setWishlist([]);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        headers: { 'X-User-Email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  // Fetch course details (including reviews)
  const fetchCourseDetails = async (id) => {
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCourseDetails(data);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
    }
  };

  // Run on filter change, search query change
  useEffect(() => {
    // Standard debounced fetch is nice, but we run immediately for tests
    fetchCourses();
  }, [searchQuery, categoryFilter, priceFilter]);

  // Run when user logging in changes
  useEffect(() => {
    fetchMyCourses();
    fetchWishlist();
  }, [userEmail]);

  // Toast handler
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle mock Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginInput.trim())) {
      showToast('Vui lòng nhập email hợp lệ', 'error');
      return;
    }
    
    // Validate password length >= 6
    if (loginPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    // Check users in localStorage
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const foundUser = users.find(u => u.email.toLowerCase() === loginInput.trim().toLowerCase());
    
    if (foundUser) {
      if (foundUser.password !== loginPassword) {
        showToast('Mật khẩu không chính xác', 'error');
        return;
      }
    } else {
      // Auto-register unrecognized emails to support playwright test runs smoothly
      const newUser = {
        name: loginInput.trim().split('@')[0],
        email: loginInput.trim(),
        password: loginPassword
      };
      users.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(users));
    }

    localStorage.setItem('userEmail', loginInput.trim());
    setUserEmail(loginInput.trim());
    setShowLoginModal(false);
    setLoginInput('');
    setLoginPassword('123456'); // Reset to default
    showToast('Đăng nhập thành công!');
  };

  // Handle mock Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    
    if (!regName.trim()) {
      showToast('Vui lòng nhập họ tên', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      showToast('Vui lòng nhập email hợp lệ', 'error');
      return;
    }

    if (regPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const emailExists = users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase());
    
    if (emailExists) {
      showToast('Email này đã được đăng ký!', 'error');
      return;
    }

    // Register user
    const newUser = {
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword
    };
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    // Log the user in automatically
    localStorage.setItem('userEmail', regEmail.trim());
    setUserEmail(regEmail.trim());
    
    // Close modal & reset form
    setShowLoginModal(false);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setAuthMode('login');
    showToast('Đăng ký tài khoản thành công!');
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    setUserEmail('');
    setActiveTab('explore');
    showToast('Đã đăng xuất tài khoản');
  };

  // Open course details modal
  const handleOpenDetails = (course) => {
    setSelectedCourse(course);
    fetchCourseDetails(course.id);
    setActiveLessonIndex(null); // Show overview first
    setIsVideoPlaying(false);
    setVideoProgress(0);
    setHomeworkAnswer('');
  };

  // Close course details modal
  const handleCloseDetails = () => {
    setSelectedCourse(null);
    setSelectedCourseDetails(null);
    setReviewComment('');
    setReviewRating(5);
    setReviewError('');
    setReviewSuccess('');
    // Reset learning states
    setActiveLessonIndex(null);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    setHomeworkAnswer('');
  };

  // Submit a Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!userEmail) {
      setReviewError('Vui lòng đăng nhập trước khi đánh giá');
      return;
    }

    // Client-side validations
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Vui lòng chọn số sao từ 1 đến 5');
      return;
    }

    if (reviewComment !== '' && reviewComment.trim().length < 3) {
      setReviewError('Bình luận phải có ít nhất 3 ký tự');
      return;
    }

    // TC-16: Enforce limit check (let's set comment length > 500 block, but wait, 
    // the user might type. We also block on backend)
    if (reviewComment.length > 500) {
      setReviewError('Bình luận không được vượt quá 500 ký tự');
      return;
    }

    // TC-20 Bug: We do NOT set isSubmittingReview to true to prevent clicks.
    // We do NOT disable the button. This allows rapid multiple clicks.
    
    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || 'Lỗi gửi đánh giá');
      }

      // Success
      setReviewSuccess('Đánh giá của bạn đã được ghi nhận!');
      setReviewComment('');
      setReviewRating(5);
      showToast('Đăng đánh giá thành công!');
      
      // Refresh course details and general list to see average updates
      fetchCourseDetails(selectedCourse.id);
      fetchCourses();
    } catch (err) {
      setReviewError(err.message);
    }
  };

  // Toggle Wishlist item
  const handleToggleWishlist = async (course) => {
    if (!userEmail) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${course.id}/wishlist`, {
        method: 'POST',
        headers: {
          'X-User-Email': userEmail
        }
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Lỗi khi cập nhật danh sách yêu thích');
      }

      const data = await res.json();
      if (data.action === 'added') {
        showToast('Đã thêm vào danh sách yêu thích!');
      } else {
        showToast('Đã xóa khỏi danh sách yêu thích!');
      }
      fetchWishlist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Course Registration Action
  const handleRegisterClick = (course) => {
    if (!userEmail) {
      // TC-23: If not logged in, trigger login modal
      setShowLoginModal(true);
      return;
    }

    setSelectedCourse(course); // Ensure it's active

    if (course.price === 0) {
      // Free course -> Register directly
      registerCourse(course.id, 'completed');
    } else {
      // Paid course -> Open checkout modal
      setCouponCode('');
      setAppliedDiscount(0);
      setCouponError('');
      setCouponSuccess('');
      setShowCheckoutModal(true);
    }
  };

  // Perform API call to register
  const registerCourse = async (courseId, paymentStatus, coupon = '') => {
    try {
      const res = await fetch(`/api/courses/${courseId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          payment_status: paymentStatus,
          coupon: coupon
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký khóa học thất bại');
      }

      // BUG (Đăng ký): hiển thị thẳng số tiền backend trả về mà không định dạng,
      // nên với mã giảm giá sẽ lòi ra số lẻ float (vd: $39.992000000000004).
      let successMsg = 'Đăng ký khóa học thành công!';
      if (data && data.amount > 0) {
        successMsg += ` Số tiền đã thanh toán: $${data.amount}`;
      }
      showToast(successMsg);
      setShowCheckoutModal(false);
      
      // If we registered from details modal, refresh it
      if (selectedCourseDetails && selectedCourse && selectedCourse.id === courseId) {
        fetchCourseDetails(courseId);
      }
      
      // Refresh lists
      fetchCourses();
      fetchMyCourses();
      fetchWishlist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Coupon Application
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    // TC-29 Expired
    if (couponCode === 'EXPIRED') {
      setCouponError('Mã giảm giá đã hết hạn');
      return;
    }

    // TC-28 Valid coupons
    if (couponCode === 'GIAM50') {
      setAppliedDiscount(0.5);
      setCouponSuccess('Áp dụng mã giảm 50% thành công!');
    } else if (couponCode === 'FREE100') {
      setAppliedDiscount(1.0);
      setCouponSuccess('Áp dụng mã miễn phí 100% thành công!');
    } else if (couponCode === 'GIAM20') {
      setAppliedDiscount(0.2);
      setCouponSuccess('Áp dụng mã giảm 20% thành công!');
    } else {
      setCouponError('Mã giảm giá không hợp lệ');
    }
  };

  // Cancel Course Registration (Refund / TC-26)
  const handleCancelCourse = async (courseId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đăng ký khóa học này?')) return;

    try {
      const res = await fetch(`/api/courses/${courseId}/cancel`, {
        method: 'POST',
        headers: {
          'X-User-Email': userEmail
        }
      });

      if (res.ok) {
        showToast('Đã hủy đăng ký khóa học thành công');
        fetchMyCourses();
        fetchCourses();
        if (selectedCourse && selectedCourse.id === courseId) {
          fetchCourseDetails(courseId);
        }
      } else {
        const msg = await res.text();
        showToast(msg || 'Lỗi khi hủy đăng ký', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // System Reset (for test isolation)
  const handleResetSystem = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Hệ thống đã được khôi phục dữ liệu gốc!');
        setUserEmail('');
        localStorage.removeItem('userEmail');
        setActiveTab('explore');
        setWishlist([]);
        setMyCourses([]);
        fetchCourses();
        handleCloseDetails();
      }
    } catch (err) {
      showToast('Khôi phục hệ thống thất bại: ' + err.message, 'error');
    }
  };

  // Calculate discounted price
  const getDiscountedPrice = (price) => {
    const final = price * (1 - appliedDiscount);
    return final < 0 ? 0 : final;
  };

  const isAlreadyRegistered = (courseId) => {
    return myCourses.some(c => c.id === courseId);
  };

  return (
    <div className="app-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`} data-testid="toast-notification">
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="navbar">
        <div className="logo-container" onClick={() => { setActiveTab('explore'); handleCloseDetails(); }}>
          <span className="logo-emoji">🎓</span>
          <span>TECHACADEMY</span>
        </div>

        <div className="nav-links">
          <span 
            className={`nav-link ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
            data-testid="explore-tab"
          >
            Khám phá
          </span>
          {userEmail && (
            <span 
              className={`nav-link ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
              data-testid="wishlist-tab"
            >
              Yêu thích <span className="wishlist-badge" data-testid="wishlist-count-badge">({wishlist.length})</span>
            </span>
          )}
          {userEmail && (
            <span 
              className={`nav-link ${activeTab === 'my-courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-courses')}
              data-testid="my-courses-tab"
            >
              Khóa học của tôi
            </span>
          )}

          {userEmail ? (
            <div className="user-badge" data-testid="user-info">
              <div className="user-avatar">{userEmail[0].toUpperCase()}</div>
              <span>{userEmail}</span>
              <button className="btn-logout" onClick={handleLogout} data-testid="logout-btn">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              className="btn-login" 
              onClick={() => setShowLoginModal(true)}
              data-testid="login-modal-trigger"
            >
              <User size={16} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </nav>

      <main className="main-container">
        {activeTab === 'explore' ? (
          <>
            {/* Hero Banner */}
            <section className="hero">
              <div className="hero-content">
                <span className="hero-tag">💡 Chào mừng đến với Kỷ nguyên Số</span>
                <h1>Nâng Tầm Kỹ Năng Lập Trình Backend & Frontend</h1>
                <p>Học từ các chuyên gia hàng đầu thông qua các dự án thực tế chất lượng cao. Khởi đầu hành trình công nghệ của bạn ngay hôm nay.</p>
                <div className="hero-stats">
                  <div className="stat-item">
                    <span className="stat-number">10K+</span>
                    <span className="stat-label">Học viên</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Khóa học chuyên sâu</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">4.9★</span>
                    <span className="stat-label">Đánh giá trung bình</span>
                  </div>
                </div>
              </div>
              <div className="hero-decoration">
                {/* Embedded visuals / Abstract shapes */}
                <Sparkles size={100} className="sparkles-icon" style={{ opacity: 0.15, color: 'var(--accent-light)' }} />
              </div>
            </section>

            {/* Filter Toolbar */}
            <section className="toolbar">
              <div className="search-box">
                <Search size={20} className="text-muted" />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Tìm kiếm khóa học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-input"
                />
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <span className="filter-label">Chủ đề:</span>
                  <button 
                    className={`filter-btn ${categoryFilter === '' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('')}
                    data-testid="filter-category-all"
                  >
                    Tất cả
                  </button>
                  <button 
                    className={`filter-btn ${categoryFilter === 'Go' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('Go')}
                    data-testid="filter-category-Go"
                  >
                    Golang
                  </button>
                  <button 
                    className={`filter-btn ${categoryFilter === 'Frontend' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('Frontend')}
                    data-testid="filter-category-Frontend"
                  >
                    Frontend
                  </button>
                  <button 
                    className={`filter-btn ${categoryFilter === 'DevOps' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('DevOps')}
                    data-testid="filter-category-DevOps"
                  >
                    DevOps
                  </button>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Học phí:</span>
                  <button 
                    className={`filter-btn ${priceFilter === '' ? 'active' : ''}`}
                    onClick={() => setPriceFilter('')}
                    data-testid="filter-price-all"
                  >
                    Tất cả
                  </button>
                  <button 
                    className={`filter-btn ${priceFilter === 'free' ? 'active' : ''}`}
                    onClick={() => setPriceFilter('free')}
                    data-testid="filter-price-free"
                  >
                    Miễn phí
                  </button>
                  <button 
                    className={`filter-btn ${priceFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => setPriceFilter('paid')}
                    data-testid="filter-price-paid"
                  >
                    Có phí
                  </button>
                </div>
              </div>
            </section>

            {/* Error simulation container (TC-10 API Error) */}
            {globalError && (
              <div className="empty-state" style={{ borderColor: 'var(--error-color)', marginBottom: '2rem' }} data-testid="api-error-display">
                <AlertCircle size={40} style={{ color: 'var(--error-color)', marginBottom: '1rem' }} />
                <h3>Đã xảy ra lỗi hệ thống</h3>
                <p style={{ marginTop: '0.5rem' }}>{globalError}</p>
              </div>
            )}

            {/* Course Catalog Grid */}
            {!globalError && (
              courses.length > 0 ? (
                <div className="course-grid">
                  {courses.map((course) => (
                    <div className="course-card" key={course.id} data-testid="course-card">
                      <div className="course-img-wrapper">
                        <img src={course.image_url} alt={course.title} className="course-img" />
                        <span className="course-badge">{course.category}</span>
                        <button 
                          className={`btn-wishlist ${wishlist.some(w => w.id === course.id) ? 'active' : ''}`}
                          onClick={() => handleToggleWishlist(course)}
                          data-testid={`wishlist-heart-toggle-${course.id}`}
                        >
                          <Heart className={`wishlist-heart ${wishlist.some(w => w.id === course.id) ? 'filled' : ''}`} size={20} />
                        </button>
                      </div>
                      <div className="course-card-content">
                        <span className="course-instructor">Giảng viên: {course.instructor}</span>
                        <h3 className="course-title">{course.title}</h3>
                        
                        <div className="course-rating-row">
                          <div className="star-rating">
                            <Star size={16} fill="currentColor" />
                          </div>
                          <span className="rating-avg">{course.rating ? course.rating.toFixed(1) : "0.0"}</span>
                          <span className="rating-count">({course.reviews_count} đánh giá)</span>
                        </div>

                        <div className="course-card-footer">
                          <span className={`course-price ${course.price === 0 ? 'free' : ''}`}>
                            {course.price === 0 ? 'Miễn phí' : `$${course.price}`}
                          </span>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn-view" 
                              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                              onClick={() => handleOpenDetails(course)}
                              data-testid={`course-detail-btn-${course.id}`}
                            >
                              Chi tiết
                            </button>

                            {isAlreadyRegistered(course.id) ? (
                              <button 
                                className="btn-view" 
                                style={{ background: 'var(--success-color)' }}
                                disabled
                                data-testid={`registered-badge-${course.id}`}
                              >
                                Đã đăng ký
                              </button>
                            ) : (
                              <button 
                                className="btn-view"
                                onClick={() => handleRegisterClick(course)}
                                data-testid={`register-btn-${course.id}`}
                              >
                                Đăng ký
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" data-testid="empty-search-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>Không tìm thấy khóa học nào phù hợp</h3>
                  <p>Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc của bạn.</p>
                </div>
              )
            )}
          </>
        ) : activeTab === 'wishlist' ? (
          /* Wishlist Tab */
          <div>
            <h2 className="reviews-title">Khóa học yêu thích ({wishlist.length})</h2>
            {wishlist.length > 0 ? (
              <div className="course-grid">
                {wishlist.map((course) => (
                  <div className="course-card" key={course.id} data-testid="wishlist-course-card">
                    <div className="course-img-wrapper">
                      <img src={course.image_url} alt={course.title} className="course-img" />
                      <span className="course-badge">{course.category}</span>
                      <button 
                        className="btn-wishlist active" 
                        onClick={() => handleToggleWishlist(course)}
                        data-testid={`wishlist-heart-toggle-${course.id}`}
                      >
                        <Heart className="wishlist-heart filled" size={20} />
                      </button>
                    </div>
                    <div className="course-card-content">
                      <span className="course-instructor">Giảng viên: {course.instructor}</span>
                      <h3 className="course-title">{course.title}</h3>
                      
                      <div className="course-rating-row">
                        <div className="star-rating">
                          <Star size={16} fill="currentColor" />
                        </div>
                        <span className="rating-avg">{course.rating ? course.rating.toFixed(1) : "0.0"}</span>
                        <span className="rating-count">({course.reviews_count} đánh giá)</span>
                      </div>

                      <div className="course-card-footer" style={{ marginTop: 'auto' }}>
                        <span className={`course-price ${course.price === 0 ? 'free' : ''}`}>
                          {course.price === 0 ? 'Miễn phí' : `$${course.price}`}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn-view" 
                            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            onClick={() => handleOpenDetails(course)}
                            data-testid={`wishlist-course-detail-btn-${course.id}`}
                          >
                            Chi tiết
                          </button>

                          {isAlreadyRegistered(course.id) ? (
                            <button 
                              className="btn-view" 
                              style={{ background: 'var(--success-color)' }}
                              disabled
                              data-testid={`wishlist-registered-badge-${course.id}`}
                            >
                              Đã đăng ký
                            </button>
                          ) : (
                            <button 
                              className="btn-view"
                              onClick={() => handleRegisterClick(course)}
                              data-testid={`wishlist-register-btn-${course.id}`}
                            >
                              Đăng ký
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" data-testid="empty-wishlist-state">
                <div className="empty-state-icon">❤️</div>
                <h3>Chưa có khóa học yêu thích nào</h3>
                <p>Hãy khám phá các khóa học công nghệ và nhấn nút Trái tim để thêm vào đây.</p>
                <button className="btn-login-submit" style={{ maxWidth: '200px', margin: '1.5rem auto 0' }} onClick={() => setActiveTab('explore')}>
                  Khám phá ngay
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Dashboard Tab */
          <div>
            <h2 className="reviews-title">Khóa học của tôi ({myCourses.length})</h2>
            {myCourses.length > 0 ? (
              <div className="course-grid">
                {myCourses.map((course) => (
                  <div className="course-card" key={course.id} data-testid="my-course-card">
                    <div className="course-img-wrapper">
                      <img src={course.image_url} alt={course.title} className="course-img" />
                      <span className="course-badge">{course.category}</span>
                    </div>
                    <div className="course-card-content">
                      <span className="course-instructor">Giảng viên: {course.instructor}</span>
                      <h3 className="course-title">{course.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--success-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
                        <CheckCircle size={14} /> Đã sở hữu khóa học
                      </p>
                      
                      <div className="course-card-footer" style={{ marginTop: 'auto' }}>
                        <button 
                          className="btn-view"
                          onClick={() => handleOpenDetails(course)}
                          data-testid={`learn-now-btn-${course.id}`}
                        >
                          Vào học ngay
                        </button>
                        <button 
                          className="btn-logout"
                          style={{ margin: 0, fontSize: '0.85rem' }}
                          onClick={() => handleCancelCourse(course.id)}
                          data-testid={`cancel-course-btn-${course.id}`}
                        >
                          Hủy đăng ký
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <h3>Bạn chưa đăng ký khóa học nào</h3>
                <p>Quay lại danh sách Khám phá để đăng ký các khóa học công nghệ tuyệt vời.</p>
                <button className="btn-login-submit" style={{ maxWidth: '200px', margin: '1.5rem auto 0' }} onClick={() => setActiveTab('explore')}>
                  Khám phá ngay
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Course Detail Modal */}
      {selectedCourse && selectedCourseDetails && (
        <div className="modal-overlay" onClick={handleCloseDetails} data-testid="course-detail-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={handleCloseDetails} data-testid="close-modal-btn">
              <X size={20} />
            </button>
            <img src={selectedCourseDetails.course.image_url} alt={selectedCourseDetails.course.title} className="modal-header-img" />
            
            <div className="modal-body">
              <span className="hero-tag" style={{ marginBottom: '0.5rem' }}>{selectedCourseDetails.course.category}</span>
              <h2 className="modal-title">{selectedCourseDetails.course.title}</h2>
              
              <div className="modal-meta-row">
                <span>Giảng viên: <strong>{selectedCourseDetails.course.instructor}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  {/* BUG (Đánh giá): trang chi tiết quên .toFixed(1) nên điểm trung bình
                      hiện nguyên số thực, ví dụ 3.3333333333333335 thay vì 3.3 */}
                  <strong>{selectedCourseDetails.course.rating ? selectedCourseDetails.course.rating : "0.0"}</strong>
                  ({selectedCourseDetails.course.reviews_count} đánh giá)
                </span>
              </div>

              <p className="modal-description">{selectedCourseDetails.course.description}</p>

              {isAlreadyRegistered(selectedCourseDetails.course.id) && (() => {
                const courseId = selectedCourseDetails.course.id;
                const lessons = COURSE_LESSONS[courseId] || [];
                const completedList = completedLessons[courseId] || [];
                const completedCount = completedList.length;
                const progressPercentage = Math.round((completedCount / lessons.length) * 100) || 0;

                const activeLesson = activeLessonIndex !== null ? lessons[activeLessonIndex] : null;

                const formatTime = (secs) => {
                  const m = Math.floor(secs / 60);
                  const s = secs % 60;
                  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                };

                const getDurationSeconds = (durationStr) => {
                  if (!durationStr) return 0;
                  const parts = durationStr.split(':');
                  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                };

                return (
                  <div className="course-learning-section" data-testid="course-learning-content">
                    {/* Progress Header */}
                    <div className="learning-header">
                      <div className="learning-header-title">
                        <Sparkles size={18} className="text-accent" />
                        <h3>Học viện cá nhân (Course Learning Hub)</h3>
                      </div>
                      <div className="learning-progress-container">
                        <div className="progress-info-row">
                          <span>Tiến độ học tập: <strong>{completedCount}/{lessons.length}</strong> bài học ({progressPercentage}%)</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Split Layout */}
                    <div className="learning-split-layout">
                      
                      {/* Left Sidebar: Lessons List */}
                      <div className="learning-sidebar">
                        <div className="sidebar-title">Danh mục bài học</div>
                        <div className="lessons-list">
                          {lessons.map((lesson, idx) => {
                            const isActive = activeLessonIndex === idx;
                            const isCompleted = completedList.includes(idx);
                            return (
                              <div 
                                key={idx} 
                                className={`lesson-sidebar-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                onClick={() => handleSelectLesson(idx)}
                                data-testid={`lesson-item-${idx}`}
                              >
                                <div className="lesson-status-icon">
                                  {isCompleted ? (
                                    <CheckCircle size={16} className="status-check" />
                                  ) : (
                                    <div className="status-dot"></div>
                                  )}
                                </div>
                                <div className="lesson-info">
                                  <div className="lesson-item-title">{lesson.title}</div>
                                  <div className="lesson-item-duration">Thời lượng: {lesson.duration}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Workspace: Lesson Content */}
                      <div className="learning-workspace">
                        {activeLessonIndex === null ? (
                          /* Overview Panel */
                          <div className="workspace-overview-panel">
                            <div className="overview-icon">🏆</div>
                            <h4>Chào mừng bạn đến với khóa học!</h4>
                            <p>Hãy chọn một bài học ở danh sách bên trái để bắt đầu xem video bài giảng, đọc tóm tắt lý thuyết, làm bài tập thực hành và ghi nhận tiến độ.</p>
                            <button 
                              className="btn-start-learning"
                              onClick={() => handleSelectLesson(0)}
                              data-testid="start-learning-btn"
                            >
                              Bắt đầu bài học đầu tiên
                            </button>
                          </div>
                        ) : (
                          /* Active Lesson Panel */
                          <div className="workspace-active-lesson">
                            {/* Header */}
                            <div className="workspace-lesson-header">
                              <button 
                                className="btn-back-overview"
                                onClick={() => setActiveLessonIndex(null)}
                              >
                                ← Quay lại tổng quan
                              </button>
                              <h4 className="active-lesson-title">{activeLesson.title}</h4>
                              <div className="active-lesson-meta">Thời lượng: {activeLesson.duration}</div>
                            </div>

                            {/* Simulated Video Player */}
                            <div className="video-player-mock">
                              <div className="video-screen">
                                {isVideoPlaying ? (
                                  <div className="video-playing-state">
                                    <div className="video-playing-anim">
                                      <div className="wave-bar"></div>
                                      <div className="wave-bar"></div>
                                      <div className="wave-bar"></div>
                                      <div className="wave-bar"></div>
                                    </div>
                                    <span className="video-playing-text">🎬 Đang phát video bài giảng...</span>
                                  </div>
                                ) : (
                                  <div 
                                    className="video-paused-state"
                                    onClick={() => setIsVideoPlaying(true)}
                                  >
                                    <div className="btn-play-large">
                                      <Play size={32} fill="currentColor" />
                                    </div>
                                    <span className="video-paused-text">
                                      {videoProgress > 0 ? "Tạm dừng video" : "Nhấn Play để xem bài giảng"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Controls */}
                              <div className="video-controls">
                                <button 
                                  className="btn-video-control" 
                                  onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                                  data-testid="video-play-toggle"
                                >
                                  {isVideoPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                                </button>
                                
                                <span className="video-timer">
                                  {formatTime(videoProgress)} / {activeLesson.duration}
                                </span>

                                <div className="video-timeline-track" onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const clickX = e.clientX - rect.left;
                                  const percentage = clickX / rect.width;
                                  const maxSec = getDurationSeconds(activeLesson.duration);
                                  setVideoProgress(Math.round(percentage * maxSec));
                                }}>
                                  <div 
                                    className="video-timeline-fill" 
                                    style={{ width: `${(videoProgress / getDurationSeconds(activeLesson.duration)) * 100}%` }}
                                  ></div>
                                </div>

                                <button 
                                  className="btn-video-control"
                                  onClick={() => setVideoProgress(0)}
                                >
                                  <RotateCcw size={16} />
                                </button>
                                
                                <Volume2 size={16} className="text-muted" style={{ marginLeft: '0.5rem' }} />
                              </div>
                            </div>

                            {/* Lesson theory content */}
                            <div className="lesson-theory-content">
                              <h5>📖 Tóm tắt bài học</h5>
                              <p>{activeLesson.content}</p>
                            </div>

                            {/* Homework Box */}
                            <div className="homework-box">
                              <h5>✍️ Bài tập thực hành</h5>
                              <p className="homework-prompt"><strong>Yêu cầu:</strong> {activeLesson.exercise}</p>
                              
                              {homeworkSubmitted[`${courseId}-${activeLessonIndex}`] ? (
                                <div className="homework-status-submitted" data-testid="homework-submitted-alert">
                                  <CheckCircle size={16} />
                                  <span>Bài tập của bạn đã được nộp thành công!</span>
                                </div>
                              ) : (
                                <div className="homework-form">
                                  <textarea 
                                    className="homework-textarea"
                                    placeholder="Nhập câu trả lời hoặc code thực hành của bạn vào đây..."
                                    value={homeworkAnswer}
                                    onChange={(e) => setHomeworkAnswer(e.target.value)}
                                    data-testid="homework-input"
                                  />
                                  <button 
                                    className="btn-submit-homework"
                                    onClick={() => handleSubmitHomework(courseId, activeLessonIndex)}
                                    data-testid="submit-homework-btn"
                                  >
                                    <Send size={14} />
                                    <span>Nộp bài giải</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Completion Check */}
                            <div className="lesson-completion-panel">
                              <button 
                                className={`btn-toggle-complete ${completedList.includes(activeLessonIndex) ? 'completed' : ''}`}
                                onClick={() => handleToggleLessonCompleted(courseId, activeLessonIndex)}
                                data-testid="toggle-lesson-complete-btn"
                              >
                                <CheckCircle size={16} />
                                <span>
                                  {completedList.includes(activeLessonIndex) 
                                    ? "Đánh dấu là chưa hoàn thành" 
                                    : "Hoàn thành bài học này"}
                                </span>
                              </button>
                            </div>

                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* Action / Checkout status in modal */}
              <div className="checkout-panel">
                <div className="checkout-price-info">
                  <span className="checkout-price-label">Giá khóa học:</span>
                  <span className={`checkout-price ${selectedCourseDetails.course.price === 0 ? 'free' : ''}`} data-testid="course-detail-price">
                    {selectedCourseDetails.course.price === 0 ? 'Miễn phí' : `$${selectedCourseDetails.course.price}`}
                  </span>
                </div>

                {isAlreadyRegistered(selectedCourseDetails.course.id) ? (
                  <button 
                    className="btn-register-action" 
                    style={{ background: 'var(--success-color)' }}
                    disabled
                    data-testid="modal-registered-btn"
                  >
                    <CheckCircle size={18} />
                    <span>Bạn đã đăng ký học</span>
                  </button>
                ) : (
                  <button 
                    className="btn-register-action"
                    onClick={() => handleRegisterClick(selectedCourseDetails.course)}
                    data-testid={`modal-register-btn-${selectedCourseDetails.course.id}`}
                  >
                    <BookOpen size={18} />
                    <span>Đăng ký tham gia học</span>
                  </button>
                )}
              </div>

              {/* Reviews Section */}
              <div className="reviews-section">
                <h3 className="reviews-title">Đánh giá từ học viên</h3>

                {/* Form to submit review */}
                <div className="review-form">
                  <h4 className="review-form-title">Để lại nhận xét của bạn</h4>
                  
                  {/* Unauthorized review message */}
                  {!userEmail && (
                    <div 
                      className="error-message" 
                      style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      data-testid="review-unauthorized-message"
                    >
                      <AlertCircle size={16} />
                      <span>Vui lòng đăng nhập trước khi gửi đánh giá.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview}>
                    <div className="rating-select">
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Đánh giá:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className={`star-btn ${reviewRating >= star ? 'selected' : ''}`}
                          onClick={() => setReviewRating(star)}
                          data-testid={`review-rating-${star}`}
                        >
                          <Star size={20} fill={reviewRating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="comment-input"
                      placeholder="Chia sẻ trải nghiệm học tập của bạn tại đây..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      disabled={!userEmail}
                      data-testid="review-comment-input"
                    />

                    {reviewError && <div className="error-message" style={{ marginBottom: '1rem' }} data-testid="review-error-message">{reviewError}</div>}
                    {reviewSuccess && <div className="success-message" style={{ marginBottom: '1rem' }} data-testid="review-success-message">{reviewSuccess}</div>}

                    <button
                      type="submit"
                      className="btn-submit-review"
                      disabled={!userEmail}
                      data-testid="review-submit-btn"
                    >
                      Gửi đánh giá
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="reviews-list">
                  {selectedCourseDetails.reviews && selectedCourseDetails.reviews.length > 0 ? (
                    selectedCourseDetails.reviews.map((rev) => (
                      <div className="review-item" key={rev.id} data-testid="review-item">
                        <div className="review-item-header">
                          <span className="review-user">{rev.user_email}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="star-rating">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={14} 
                                  fill={i < rev.rating ? 'currentColor' : 'none'} 
                                  color={i < rev.rating ? '#fbbf24' : 'var(--text-muted)'} 
                                />
                              ))}
                            </div>
                            <span className="review-date">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <p 
                          className="review-comment" 
                          data-testid="review-comment-text"
                          dangerouslySetInnerHTML={{
                            __html: rev.comment ? rev.comment.replace(/\n/g, '<br />') : "(Không có bình luận)"
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                      Chưa có đánh giá nào cho khóa học này. Hãy là người đầu tiên!
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setAuthMode('login'); }} data-testid="login-modal">
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => { setShowLoginModal(false); setAuthMode('login'); }} data-testid="close-login-btn">
              <X size={20} />
            </button>
            <div className="modal-body" style={{ padding: '2rem' }}>
              
              {/* Auth tabs */}
              <div className="auth-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '1rem' }}>
                <button 
                  className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthMode('login')}
                  data-testid="tab-login-btn"
                >
                  Đăng nhập
                </button>
                <button 
                  className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthMode('register')}
                  data-testid="tab-register-btn"
                >
                  Đăng ký
                </button>
              </div>

              {authMode === 'login' ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>🔐</span>
                    <h2 style={{ marginTop: '0.25rem' }}>Đăng nhập</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Truy cập hệ thống khóa học công nghệ</p>
                  </div>

                  <form onSubmit={handleLoginSubmit}>
                    <div className="login-form-group">
                      <label htmlFor="email-input">Địa chỉ Email</label>
                      <input
                        id="email-input"
                        type="text"
                        className="login-input"
                        placeholder="name@gmail.com"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        required
                        data-testid="email-input"
                      />
                    </div>

                    <div className="login-form-group">
                      <label htmlFor="password-input">Mật khẩu</label>
                      <input
                        id="password-input"
                        type="password"
                        className="login-input"
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        data-testid="password-input"
                      />
                    </div>

                    <button type="submit" className="btn-login-submit" data-testid="login-submit-btn">
                      Xác nhận đăng nhập
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>📝</span>
                    <h2 style={{ marginTop: '0.25rem' }}>Đăng ký tài khoản</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Tạo tài khoản mới để bắt đầu học</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit}>
                    <div className="login-form-group">
                      <label htmlFor="register-name-input">Họ và Tên</label>
                      <input
                        id="register-name-input"
                        type="text"
                        className="login-input"
                        placeholder="Nguyễn Văn A"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        data-testid="register-name-input"
                      />
                    </div>

                    <div className="login-form-group">
                      <label htmlFor="register-email-input">Địa chỉ Email</label>
                      <input
                        id="register-email-input"
                        type="text"
                        className="login-input"
                        placeholder="name@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        data-testid="register-email-input"
                      />
                    </div>

                    <div className="login-form-group">
                      <label htmlFor="register-password-input">Mật khẩu</label>
                      <input
                        id="register-password-input"
                        type="password"
                        className="login-input"
                        placeholder="Tối thiểu 6 ký tự"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        data-testid="register-password-input"
                      />
                    </div>

                    <button type="submit" className="btn-login-submit" data-testid="register-submit-btn">
                      Xác nhận đăng ký
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Redirection / QR Code) */}
      {showCheckoutModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)} data-testid="checkout-modal">
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Thanh toán học phí</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Quét mã QR sau để thanh toán cho khóa học:<br /><strong>{selectedCourse.title}</strong></p>
            
            <div className="qr-code-wrapper">
              {/* Dynamic QR Code generator mock */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Payment for ${selectedCourse.title} by ${userEmail} amt ${getDiscountedPrice(selectedCourse.price)}`)}`} 
                alt="QR Code" 
                className="qr-code-img"
                data-testid="payment-qr-code"
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Giá gốc:</span>
                <span>${selectedCourse.price}</span>
              </div>
              
              {appliedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-light)', marginBottom: '0.5rem' }}>
                  <span>Giảm giá:</span>
                  <span>-${(selectedCourse.price * appliedDiscount).toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span>Tổng tiền:</span>
                <span data-testid="checkout-discounted-price">${getDiscountedPrice(selectedCourse.price).toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Application */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mã giảm giá (Coupon):</label>
              <div className="coupon-box">
                <input 
                  type="text" 
                  className="coupon-input" 
                  placeholder="GIAM50, FREE100..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  data-testid="coupon-input"
                />
                <button className="btn-coupon-apply" onClick={handleApplyCoupon} data-testid="coupon-apply-btn">
                  Áp dụng
                </button>
              </div>
              {couponError && <div className="error-message" data-testid="coupon-error-message">{couponError}</div>}
              {couponSuccess && <div className="success-message" data-testid="coupon-success-message">{couponSuccess}</div>}
            </div>

            <div className="payment-buttons">
              <button 
                className="btn-pay-confirm"
                onClick={() => registerCourse(selectedCourse.id, 'completed', couponCode)}
                data-testid="pay-confirm-btn"
              >
                Hoàn tất thanh toán
              </button>
              <button 
                className="btn-pay-cancel"
                onClick={() => registerCourse(selectedCourse.id, 'cancelled', couponCode)}
                data-testid="pay-cancel-btn"
              >
                Hủy thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Footer */}
      <footer className="system-footer">
        <div>© 2026 Học Viện Công Nghệ TECHACADEMY. Developed for testing purposes.</div>
      </footer>
    </div>
  );
}
