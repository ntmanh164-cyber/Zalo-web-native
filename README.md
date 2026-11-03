# Zalo Native

Ứng dụng desktop chạy Zalo Web, với thanh công cụ gọn lấy cảm hứng từ Telegram. Đây là ứng dụng độc lập, không phải sản phẩm chính thức của Zalo. Phần chat được phục vụ bởi Zalo Web; Electron cung cấp cửa sổ và tích hợp hệ điều hành, không phải bản viết lại Zalo bằng Swift/WinUI.

## Chạy

Yêu cầu Node.js 24 và npm.

```sh
npm ci
npm start
```

Đăng nhập bằng QR hoặc phương thức Zalo cung cấp. Phiên đăng nhập nằm trong profile của ứng dụng trên máy. Không nhập thông tin đăng nhập vào giao diện của bên thứ ba.

## Tính năng

- macOS dùng `hiddenInset` với traffic lights thật ở góc thanh bên. Windows dùng nút cửa sổ hệ thống.
- Bố cục Telegram: không có thanh điều hướng dọc. Menu **Tin nhắn · Danh bạ · Đã lưu · Chụp ảnh · Cài đặt** nằm dưới danh sách chat. Đã lưu mở My Documents thật của Zalo. Tiêu đề và nút tài khoản nằm trong cột trái; khung chat bên phải sử dụng trọn chiều cao cửa sổ.
- Font hệ thống San Francisco / Segoe UI, thanh cuộn mảnh xuất hiện khi rê chuột hoặc cuộn.
- Cột chat 316 px, hoặc 292 px khi cửa sổ nhỏ; có thể tăng lên 356 px bằng cách tắt Bố cục gọn. Nền đọc xanh nhạt, bong bóng tin đến trắng và tin đi xanh. Ô soạn tin một hàng với nút kẹp giấy để mở khay công cụ Zalo gốc. Khi bật ẩn banner, màn hình chào quảng bá được thay bằng lời nhắc chọn cuộc trò chuyện.
- Bộ lọc banner tải Zalo PC, sticker, zStyle, theo selector và văn bản trong vùng quảng bá. Theo dõi thay đổi DOM. Không lọc theo văn bản toàn trang hay xoá dialog chung.
- Chụp vùng màn hình: **Cmd+Shift+5** trên Mac, **Ctrl+Shift+5** trên Windows, hoặc nút chụp ở thanh bên. Kéo chọn vùng, Esc để huỷ. Hỗ trợ nhiều màn hình và ảnh Retina.
- Xem lại ảnh; lưu PNG, sao chép, hoặc dán vào ô chat. Không tự gửi. Nếu không tìm thấy ô soạn tin, ảnh nằm trên clipboard để bạn tự dán.
- Phiên Zalo tách biệt với UI; trang web không có Node.js hoặc cầu nối IPC. Link ngoài mở trong trình duyệt.

macOS yêu cầu cấp quyền **Ghi màn hình** trong Cài đặt hệ thống → Quyền riêng tư & Bảo mật. Khi vừa cấp quyền, có thể cần mở lại ứng dụng. Phím chụp chỉ có tác dụng khi ứng dụng đang hoạt động.

## Đóng gói

```sh
npm run dist:mac -- --arm64
npm run dist:mac -- --x64
npm run dist:win -- --x64
```

Đầu ra trong `release/`. Workflow `.github/workflows/build.yml` build macOS và Windows trên runner tương ứng qua workflow_dispatch hoặc tag `v*`. Bản phân phối công khai cần chứng chỉ ký Windows và ký/notarize Apple. Build local chưa ký có thể bị hệ điều hành cảnh báo.

## Kiểm tra

```sh
npm test
npm run test:smoke
```

Smoke test mở Electron với profile tạm, kiểm tra vị trí menu khi resize, quyền IPC của thanh công cụ, lưu cấu hình, kết nối Zalo, cách ly trang web, bộ lọc banner và khay công cụ với fixture. Không đăng nhập hoặc gửi tin nhắn.

## Giới hạn cần kiểm chứng với tài khoản

Zalo thay đổi DOM độc lập với ứng dụng. Banner có selector mới có thể cần bổ sung; không thể cam kết ẩn mọi quảng bá chưa quan sát. CSS compact/bo góc cần kiểm tra sau đăng nhập và điều chỉnh theo DOM thực tế. Cuộc gọi, thông báo, upload và dán ảnh phụ thuộc chức năng Zalo Web, quyền hệ điều hành và phải được kiểm tra với phiên đăng nhập thật. Không giả lập dữ liệu chat hoặc tự động gửi nội dung. Windows cần kiểm thử trên máy Windows trước khi phát hành.

Tài liệu API: https://www.electronjs.org/docs/latest/api/desktop-capturer/

Phiên bản 0.2.0 đã được kiểm tra giao diện trên macOS với tài khoản đăng nhập thật: Tin nhắn, Danh bạ, My Documents, Cài đặt, các bong bóng và ô soạn tin. Các tab phân loại Ưu tiên/Khác vẫn dùng đúng chức năng phân loại Zalo hiện có. Không gửi tin nhắn hoặc tải tệp lên trong quá trình kiểm thử.
