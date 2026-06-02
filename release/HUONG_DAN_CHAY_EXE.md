# Hướng Dẫn Chạy Công Cụ Đăng Bài Đồng Loạt Auto Poster (.exe)

Ứng dụng đã được đóng gói thành công thành một tệp thực thi duy nhất dành cho hệ điều hành **Windows 64-bit** (`facebook-auto-poster.exe`). Bạn có thể sử dụng ứng dụng này một cách độc lập mà không cần cài đặt Node.js hay chạy các dòng lệnh phức tạp.

---

## 🛠️ Hướng Dẫn Sử Dụng Trên Máy Tính Windows

### Bước 1: Tải xuống thư mục ứng dụng
1. Để lấy tệp `.exe` này, bạn hãy xuất (Export) dự án này dưới dạng **ZIP** thông qua menu **Settings** của Google AI Studio (hoặc kết nối với GitHub của riêng bạn).
2. Sau khi giải nén, tệp tin nằm tại đường dẫn: `release/facebook-auto-poster.exe`.

### Bước 2: Cài đặt khóa API bí mật (Chọn thêm nếu muốn dùng AI)
Nếu bạn muốn sử dụng tính năng **Soạn Thảo Nội Dung Bằng AI (Gemini 3.5 Flash)** và **Tự Động Tạo Ảnh Trực Quan Minh Họa (Gemini 2.5 Image)** trong app khi chạy offline trên máy tính cá nhân:
1. Tạo một tệp mới tên là `.env` nằm **ngay cạnh** tệp `facebook-auto-poster.exe` của bạn.
2. Mở tệp `.env` vừa tạo bằng ứng dụng WordPad / Notepad và dán dòng cấu hình sau vào:
   ```env
   GEMINI_API_KEY="Khóa_API_Gemini_Của_Bạn_Ở_Đây"
   ```
   *(Hãy thay thế `Khóa_API_Gemini_Của_Bạn_Ở_Đây` bằng khóa API được tạo miễn phí từ Google AI Studio).*

### Bước 3: Khởi chạy và Trải Nghiệm
1. **Double-click (nhấp đúp hai lần)** vào tệp tin `facebook-auto-poster.exe`.
2. Hệ thống sẽ tự động khởi động một máy chủ nền siêu nhẹ trên máy tính của bạn tại cổng mạng `3000`.
3. Chỉ trong vòng 1 giây, **trình duyệt Web mặc định của bạn sẽ tự động mở ra** và truy cập vào địa chỉ:
   ```text
   http://localhost:3000
   ```
4. Tại đây, toàn bộ giao diện điều khiển Fanpage, trình soạn thảo, kho ảnh đính kèm, trình tạo ảnh AI và mục Nhật ký lịch sử đăng sẽ hiển thị và hoạt động mượt mà.

---

## 💡 Các Ưu Điểm Khi Chạy Phiên Bản .exe Này:
* **Không cần cấu hình hay cài đặt Node.js / NPM**: Tất cả thư viện giao diện React (Vite, TailwindCSS) và chương trình máy chủ ExpressJS đã được nén tích hợp bên trong một tệp duy nhất.
* **Hỗ trợ chạy Offline kết hợp API cực nhanh**: Trình duyệt kết nối trực tiếp đến máy chủ cục bộ giúp phản hồi các thao tác quản lý/cập nhật ngay lập tức.
* **Auto-Launch thông minh**: Bạn không cần nhớ địa chỉ IP hay mở Command Prompt để chạy lệnh, ứng dụng tự động mở tab trình duyệt cho bạn.
