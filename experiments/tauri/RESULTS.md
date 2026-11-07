# Kết quả thử nghiệm

Ngày 2026-11-07. Máy macOS 15.6 / Apple Silicon. Tauri 2.12.5; Wry 0.57.1; Rust 1.99.1. Bản thử riêng, không thay Electron 0.2.6.

| Kiểm tra | Kết quả |
| --- | --- |
| Rust compile và kiểm thử giới hạn URL xác thực | Qua |
| Tạo ứng dụng macOS native | Qua |
| Mở chat.zalo.me và chuyển sang id.zalo.me | Qua, trang đăng nhập hiển thị trong WKWebView |
| Xác nhận QR và vào danh sách chat | Qua: người dùng xác nhận, đã thấy danh sách chat trong WebKit |
| Chọn ảnh / tệp tại trang kiểm thử nội bộ | Qua: PNG 12.841 byte được đọc và xem trước |
| Dán PNG tại trang nội bộ | Qua: sao chép bằng Clipboard API rồi Cmd+V nhận image/png 451 byte |
| Tải PNG kiểm thử | Qua: Downloads/zalo-rust-lab-test.png, 240 × 120 RGBA |
| Đính kèm PNG vào ô soạn Zalo / My Documents | Qua: người dùng xác nhận ảnh hiện trong ô soạn |
| Bấm Gửi và kiểm tra máy chủ Zalo nhận ảnh / tệp | Chưa kiểm tra |
| Khôi phục đăng nhập sau khi mở lại | Qua: đóng bản debug, mở bản release trong Applications, danh sách chat xuất hiện mà không quét lại |
| Windows build / chạy trên Windows thật | Rust test và bộ cài NSIS x64 build thành công trên runner Windows; chưa thử UI Windows thật |

Không suy ra thành công của Zalo từ kiểm thử nội bộ. Chưa đủ bằng chứng để thay thế bản Electron.

Bản release macOS đã cài tại `/Applications/Zalo Native Rust Lab.app`, bundle 0.1.0 khoảng 13,73 MiB (0.3.0 khoảng 17,78 MiB). Kích thước nhỏ vì dùng WebKit của hệ thống; chưa chứa đủ tính năng tương đương Electron.

Lưu ý WebKit: nút sao chép PNG phải tạo `ClipboardItem` với Promise và gọi `clipboard.write` ngay trong sự kiện click; await tạo ảnh trước khi gọi sẽ mất user gesture. Đã sửa và kiểm tra lại thành công. Tham khảo [WebKit Clipboard API](https://webkit.org/blog/10855/async-clipboard-api/) và [WebKit bug 222262](https://bugs.webkit.org/show_bug.cgi?id=222262).

GitHub Actions [run 42390976593](https://github.com/ntmanh164-cyber/Zalo-web-native/actions/runs/42390976593) đã thành công cả macOS và Windows (nguồn Rust tại commit `8c038f1`). Bản macOS cài tại máy còn có bản sửa JavaScript bảo toàn user gesture cho nút sao chép PNG của trang kiểm thử. Tệp Windows được tải về `release/rust-lab/windows/`; ZIP macOS mới nhất ở `release/rust-lab/`. Chưa phát hành thay thế Electron.

## Chuyển tính năng sang Rust 0.2.0

- Kiểm thử Rust: giới hạn URL, điều hướng allowlist, crop Retina/bounds và capability Zalo không có lệnh native nhạy cảm đều qua.
- Bản macOS đã đóng gói và cài trong Applications: giao diện Telegram, menu dưới, cài đặt nội bộ hiển thị.
- Đã kiểm tra thực tế việc ẩn cửa sổ Zalo trước chụp và mở ảnh vùng chọn ở cửa sổ xem trước.
- Đã yêu cầu thông báo kiểm thử native; việc nhìn thấy popup và đính kèm ảnh mới đang chờ người dùng xác nhận.
- Windows 0.2.0 cần build và kiểm thử giao diện trên máy thật; chưa coi kết quả 0.1.0 là kết quả của 0.2.0.

## Bố cục tham chiếu Olaz (0.3.0)

Người dùng chọn cả bố cục ba cột: sidebar bên trái, danh sách ở giữa, khung chat bên phải. Mã Swift và các hình nền của Olaz không được đưa vào bản Rust; bản này vẫn tải Zalo Web và giữ các chức năng đã có.

Sau kiểm thử 0.2.0, macOS được xác nhận đang tắt thông báo của Rust Lab và đã bật lại riêng cho ứng dụng. Ảnh chụp được giữ ở Downloads bằng hộp thoại lưu native. Đính kèm ảnh đang được kiểm tra lại sau khi mở đúng cuộc trò chuyện và bổ sung xử lý lỗi IPC dạng chuỗi.

Kiểm tra bổ sung 0.3.0 trên macOS:

- Bố cục ba cột hiển thị đúng; vùng web được dịch bằng bounds native để không che nội dung zCloud. Mở My Documents và ô soạn thành công sau khi khởi động lại.
- Native Rust ghi PNG vào clipboard và gọi paste trên WKWebView: trang kiểm thử nhận `image/png`, 451 byte. Đây là kiểm tra đường dán native, không xác nhận việc đính kèm của Zalo.
- Bài thử thông báo chờ 3 giây để có thời gian chuyển ứng dụng ra nền; vẫn cần xác nhận banner thực tế.
- Bốn kiểm thử Rust và bản đóng gói macOS mới đều qua. GitHub Actions 42396383188 đã build hai nền tảng ở commit 75fdc15; các sửa bounds/clipboard bổ sung cần CI mới.
