# Zalo Native Rust Lab

Bản thử nghiệm Rust + Tauri 2, tách khỏi ứng dụng Electron. macOS dùng WKWebView; Windows dùng WebView2. Từ bản Rust 0.2.0 đã chuyển giao diện Telegram, chụp vùng màn hình và thông báo sang Rust. Bản Electron vẫn được giữ riêng.

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

## Tính năng Rust 0.3.0

- Bố cục ba cột lấy cảm hứng từ [Olaz / zalo-swift-re](https://github.com/qnguyen3/zalo-swift-re): sidebar điều hướng theo nhóm, danh sách chat ở giữa và nội dung bên phải. Màu trung tính, viền mảnh, tin đến xám, tin đi xanh và ô soạn bo tròn. Đây là HTML/CSS riêng của bản Rust, dùng dữ liệu và thao tác của Zalo Web.
- Sidebar và header là webview nội bộ riêng. macOS có traffic lights native lồng vào sidebar. Windows giữ khung cửa sổ native.
- Chụp vùng bằng **Cmd+Shift+5 / Ctrl+Shift+5**, menu hoặc nút **Chụp ảnh**. Rust ẩn toàn bộ cửa sổ ứng dụng, đợi compositor ổn định, rồi chụp từng màn hình bằng Xcap. Hỗ trợ nhiều màn hình và tỉ lệ Retina.
- Chọn vùng trên canvas, **Esc** để huỷ. Xem trước, lưu PNG bằng hộp thoại native, sao chép bằng clipboard Rust hoặc đính kèm vào ô soạn. Rust đợi ô soạn xác nhận sẵn sàng trước khi dán; không tự bấm Gửi.
- Thông báo native qua plugin notification. Tín hiệu từ Notification của Zalo và thay đổi số tin chưa đọc được gom lại, chống lặp. Nội dung popup chung, không đưa nội dung tin nhắn vào log. Bấm popup để đưa Zalo ra trước.
- Cài đặt: bố cục gọn, ẩn banner, bật/tắt thông báo và thử popup. Preferences lưu trong app data của Rust Lab.
- Không sao chép cookies Electron. Giữ identifier `me.zalonative.rustlab` để dùng lại phiên Rust đã đăng nhập.
- Capability của trang Zalo chỉ có `allow-observe` trên đúng `https://chat.zalo.me/*`; không có quyền chụp màn hình, đọc clipboard hoặc filesystem. Các thao tác native chỉ nhận từ các webview đóng gói nội bộ, đồng thời Rust kiểm tra lại nhãn và URL.
- Trang thử ảnh/tệp nội bộ vẫn có trong menu **Thử nghiệm**.

macOS cần bật quyền **Ghi màn hình** cho **Zalo Native Rust Lab**, sau đó mở lại ứng dụng. Quyền thông báo và chế độ Tập trung của macOS có thể ảnh hưởng việc hiển thị banner.

## Kiểm tra thực tế cần làm

1. Quét QR mới, xác nhận trên điện thoại, kiểm tra vào được danh sách chat.
2. Đóng/mở Rust Lab và kiểm tra còn đăng nhập.
3. Trong My Documents, đính kèm một ảnh/tệp thử không chứa dữ liệu riêng; kiểm tra phần xem trước. Chỉ bấm Gửi nếu muốn gửi tệp đó.
4. Kiểm tra tải lại tệp đã gửi và mở liên kết ngoài.
5. Thực hiện cùng các bước trên máy Windows thật trước khi kết luận thay thế Electron được.

Việc chọn/dán ảnh thành công trên trang nội bộ không đồng nghĩa máy chủ Zalo đã chấp nhận ảnh. Kết quả được ghi trong `RESULTS.md` theo từng môi trường.

Ảnh đang xem trước có thể lưu bằng **Lưu PNG**. Menu **Mở ảnh PNG…** mở lại ảnh đã lưu; **Ảnh PNG kiểm thử** tạo ảnh màu trơn không có dữ liệu riêng để thử clipboard/đính kèm. Nếu chưa mở cuộc trò chuyện, ứng dụng giữ ảnh xem trước và yêu cầu chọn cuộc trò chuyện trước khi dán.
