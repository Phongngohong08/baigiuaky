# Hướng dẫn Cài đặt Docker, Nginx & Cấu hình SSL trên Cloud VM (Ubuntu)

Tài liệu này hướng dẫn chi tiết từng bước cài đặt Docker, Nginx, Certbot SSL và cách cấu hình reverse proxy trên máy ảo GCP VM để chạy dự án.

---

## 🐋 Phần 1: Cài đặt Docker & Docker Compose

Chạy các lệnh sau trên terminal của VM để cài đặt Docker:

### 1. Cập nhật hệ thống và cài đặt các gói bổ trợ
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
```

### 2. Thêm khóa GPG chính thức của Docker
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 3. Thiết lập kho lưu trữ (Repository)
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 4. Cài đặt Docker Engine & Docker Compose
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 5. Cấu hình chạy Docker không cần quyền `sudo` (Tùy chọn nhưng khuyến khích)
```bash
sudo usermod -aG docker $USER
# Sau đó logout ssh và login lại để thay đổi có hiệu lực
```

---

## 🌐 Phần 2: Cài đặt Nginx & Certbot SSL trên Host VM

Chúng ta cài đặt Nginx trực tiếp trên hệ điều hành của VM (Host) để làm cổng quản lý chứng chỉ SSL Let's Encrypt, sau đó chuyển tiếp yêu cầu vào hệ thống Docker container.

### 1. Cài đặt Nginx
```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Cài đặt Certbot (Để tạo chứng chỉ SSL HTTPS miễn phí)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 🛠️ Phần 3: Cấu hình Host Nginx Reverse Proxy & SSL

### 1. Tạo file cấu hình Nginx cho tên miền
Tạo file cấu hình mới tại `/etc/nginx/sites-available/khoahoc.phongngohong.online`:
```bash
sudo nano /etc/nginx/sites-available/khoahoc.phongngohong.online
```

Dán nội dung cấu hình sau vào (Cấu hình này sẽ nhận yêu cầu từ cổng 80/443 của domain và chuyển tiếp tới cổng `3000` - nơi Docker Frontend đang chạy):
```nginx
server {
    listen 80;
    server_name khoahoc.phongngohong.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Kích hoạt cấu hình và khởi động lại Nginx
```bash
# Tạo liên kết để kích hoạt cấu hình
sudo ln -s /etc/nginx/sites-available/khoahoc.phongngohong.online /etc/nginx/sites-enabled/

# Kiểm tra cú pháp file cấu hình xem có lỗi không
sudo nginx -t

# Nếu báo "syntax is ok", tiến hành tải lại cấu hình Nginx
sudo systemctl reload nginx
```

### 3. Cài đặt SSL HTTPS tự động với Certbot
Chạy lệnh sau để Certbot tự động cấu hình SSL và chuyển hướng mọi truy cập từ HTTP sang HTTPS:
```bash
sudo certbot --nginx -d khoahoc.phongngohong.online
```
*Nhập email của bạn và chọn `Yes` khi được hỏi để xác nhận đăng ký SSL.*

---

## 📦 Phần 4: Vận hành Dự án bằng Docker Compose

Sau khi đã cấu hình xong Nginx trên Host, bạn chỉ cần tải mã nguồn dự án lên VM, chuyển vào thư mục gốc của dự án và chạy:

```bash
# 1. Chạy dừng hệ thống cũ (nếu có)
docker compose down

# 2. Build image và khởi chạy hệ thống dưới nền (Cổng 3000 cho Frontend và 8080 cho Backend)
docker compose up -d --build
```

### Giải thích về file `nginx.conf` bên trong thư mục `frontend/`
File `frontend/nginx.conf` mà chúng ta viết đóng vai trò là **Nginx nội bộ bên trong Docker**. Khi chạy Docker Compose:
- **Host Nginx (Của máy ảo)** nhận request HTTPS trên cổng 443 từ client và chuyển tiếp (Reverse Proxy) vào `http://localhost:3000` trên Host.
- **Docker Frontend (Nginx nội bộ cổng 80 ánh xạ ra cổng 3000 của Host)** nhận request từ Host Nginx. 
  - Nếu là request static file (React UI), nó trả về file HTML/CSS/JS.
  - Nếu request bắt đầu bằng `/api/*`, Nginx nội bộ này sẽ chuyển tiếp (Reverse Proxy) sang Go backend container (`http://backend:8080`) thông qua mạng nội bộ Docker.
