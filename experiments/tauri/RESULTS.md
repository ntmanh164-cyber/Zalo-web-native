# Kết quả thử nghiệm

Ngày 2026-11-07. Máy macOS 15.6 / Apple Silicon. Tauri 2.12.5; Wry 0.57.1; Rust 1.99.1. Bản thử riêng, không thay Electron 0.2.6.

| Kiểm tra | Kết quả |
| --- | --- |
| Rust compile và kiểm thử giới hạn URL xác thực | Qua |
| Tạo ứng dụng macOS native | Qua |
| Mở chat.zalo.me và chuyển sang id.zalo.me | Qua, trang đăng nhập hiển thị trong WKWebView |
| Xác nhận QR và vào danh sách chat | Đang chờ kiểm tra với điện thoại |
| Chọn ảnh / tệp tại trang kiểm thử nội bộ | Chưa kiểm tra |
| Dán PNG tại trang nội bộ | Chưa kiểm tra |
| Tải PNG kiểm thử | Chưa kiểm tra |
| Gửi ảnh / tệp qua máy chủ Zalo | Chưa kiểm tra |
| Khôi phục đăng nhập sau khi mở lại | Chưa kiểm tra |
| Windows build / chạy trên Windows thật | Chưa kiểm tra |

Không suy ra thành công của Zalo từ kiểm thử nội bộ. Chưa đủ bằng chứng để thay thế bản Electron.
