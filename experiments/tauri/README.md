# Zalo Native Rust Lab

Bản thử nghiệm Rust + Tauri 2, tách khỏi ứng dụng Electron. macOS dùng WKWebView; Windows dùng WebView2. Chưa thay thế bản Electron 0.2.6.

## Chạy và đóng gói

Cài Rust stable và công cụ hệ điều hành theo [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/), Node.js 24+. Tại thư mục này:

```sh
npm ci
npm run dev
npm test
npm run build -- --bundles app   # macOS
npm run build -- --bundles nsis  # Windows
```

Đầu ra trong `src-tauri/target/release/bundle/`. Nếu cargo chưa nằm trong PATH, mở terminal mới sau khi cài Rust. Trên máy đang thử nghiệm, Rust được cài bằng rustup với profile minimal; không thay đổi cấu hình shell tự động.

## Phạm vi thử

- Cửa sổ native tải `https://chat.zalo.me/`, giữ giao diện gốc để kiểm tra tương thích WebKit trước khi chuyển giao diện Telegram.
- Các chặng đăng nhập QR được cho phép theo đúng hostname/path đã quan sát ở bản Electron.
- Liên kết mở bằng trình duyệt mặc định; hỗ trợ cửa sổ trống được gán URL sau đó.
- Giữ trình chọn tệp và thao tác dán ảnh gốc của webview. Tắt trình xử lý drag/drop của Tauri để trang web nhận được drag/drop.
- Menu **Thử nghiệm → Kiểm tra ảnh / tệp** mở trang nội bộ: chọn ảnh, dán PNG, tải PNG mẫu. Trang này không tải tệp lên máy chủ.
- Không cấp capability hoặc command native nào cho Zalo từ xa. Phiên WebKit dùng ứng dụng/identifier riêng; không sao chép cookies từ Electron.
- Chưa chuyển tính năng chụp vùng màn hình, thông báo native hay toàn bộ giao diện Telegram sang Rust.

## Kiểm tra thực tế cần làm

1. Quét QR mới, xác nhận trên điện thoại, kiểm tra vào được danh sách chat.
2. Đóng/mở Rust Lab và kiểm tra còn đăng nhập.
3. Trong My Documents, đính kèm một ảnh/tệp thử không chứa dữ liệu riêng; kiểm tra phần xem trước. Chỉ bấm Gửi nếu muốn gửi tệp đó.
4. Kiểm tra tải lại tệp đã gửi và mở liên kết ngoài.
5. Thực hiện cùng các bước trên máy Windows thật trước khi kết luận thay thế Electron được.

Việc chọn/dán ảnh thành công trên trang nội bộ không đồng nghĩa máy chủ Zalo đã chấp nhận ảnh. Kết quả được ghi trong `RESULTS.md` theo từng môi trường.
