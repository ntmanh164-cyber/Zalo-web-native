# Cài đặt Zalo Native 0.2.1

Tải bộ cài tại [GitHub Releases](https://github.com/ntmanh164-cyber/Zalo-web-native/releases/tag/v0.2.1). Bạn không cần cài Node.js hoặc npm để sử dụng bộ cài.

| Máy của bạn | Tệp cần tải |
| --- | --- |
| Mac dùng Apple Silicon (chip dòng M), macOS 13 trở lên | [Zalo-Native-0.2.1-macOS-arm64.dmg](https://github.com/ntmanh164-cyber/Zalo-web-native/releases/download/v0.2.1/Zalo-Native-0.2.1-macOS-arm64.dmg) |
| Windows x64 | [Zalo-Native-Setup-0.2.1-Windows-x64.exe](https://github.com/ntmanh164-cyber/Zalo-web-native/releases/download/v0.2.1/Zalo-Native-Setup-0.2.1-Windows-x64.exe) |

Bản macOS trong release này dành cho Apple Silicon, chưa có bộ cài Mac Intel. Bản Windows đã đóng gói thành công nhưng chưa được kiểm thử trên máy Windows thật.

## macOS

1. Tải và mở tệp `.dmg` phù hợp ở trên.
2. Kéo **Zalo Native** vào thư mục **Applications / Ứng dụng** trong cửa sổ bộ cài.
3. Nếu đã có bản cũ, thoát Zalo Native trước khi thay thế ứng dụng.
4. Mở **Applications → Zalo Native**. Dùng Zalo trên điện thoại quét QR và xác nhận **Đăng nhập**.
5. Khi cài xong, có thể eject ổ đĩa bộ cài. Các lần sau mở ứng dụng từ Applications.

### Khi macOS cảnh báo chưa xác minh nhà phát triển

Bản này chưa ký bằng Developer ID và chưa notarize với Apple. macOS có thể chặn lần mở đầu tiên. Chỉ mở bản tải từ release của dự án sau khi kiểm tra nguồn và mã SHA-256.

Nếu bạn quyết định tiếp tục, vào **System Settings → Privacy & Security / Cài đặt hệ thống → Quyền riêng tư & Bảo mật** và dùng **Open Anyway / Vẫn mở** cho đúng ứng dụng Zalo Native nếu tuỳ chọn này xuất hiện. Xem [hướng dẫn chính thức của Apple](https://support.apple.com/en-us/102445). Nếu hệ thống báo phát hiện phần mềm độc hại hoặc tệp bị thay đổi, dừng cài đặt và kiểm tra lại tệp; không tắt bảo vệ toàn hệ thống.

### Quyền chụp màn hình

1. Bấm **Chụp ảnh** dưới danh sách chat hoặc nhấn **Cmd+Shift+5** khi ứng dụng đang hoạt động.
2. Nếu chưa được cấp quyền, mở **System Settings → Privacy & Security → Screen Recording**. Tên mục có thể là **Screen & System Audio Recording** trên một số phiên bản macOS.
3. Bật quyền cho **Zalo Native**. Nếu không thấy ứng dụng, thử chụp màn hình một lần để hệ thống ghi nhận yêu cầu.
4. Thoát và mở lại ứng dụng nếu macOS yêu cầu.

## Windows

1. Tải tệp `Zalo-Native-Setup-0.2.1-Windows-x64.exe`.
2. Mở bộ cài, chọn vị trí cài nếu cần và làm theo trình cài đặt.
3. Mở **Zalo Native** từ Start menu hoặc shortcut do bộ cài tạo.
4. Quét QR bằng Zalo trên điện thoại và xác nhận **Đăng nhập**.

Bộ cài Windows hiện chưa ký số, nên Windows hoặc trình duyệt có thể cảnh báo về nhà phát hành hoặc độ uy tín của tệp. Kiểm tra nguồn tải và SHA-256 trước khi quyết định chạy; không cần tắt Microsoft Defender để cài đặt.

## Sử dụng nhanh

- **Tin nhắn:** quay về khu vực trò chuyện.
- **Danh bạ:** mở danh bạ Zalo hiện có.
- **Đã lưu:** mở cuộc trò chuyện **My Documents**.
- **Chụp ảnh:** kéo chọn một vùng màn hình; **Esc** để huỷ. Xem lại ảnh rồi chọn lưu PNG, sao chép hoặc đính kèm vào Zalo. Ứng dụng không tự gửi ảnh.
- **Phím chụp:** **Cmd+Shift+5** trên Mac, **Ctrl+Shift+5** trên Windows; chỉ hoạt động khi ứng dụng đang được sử dụng.
- **Hàng công cụ soạn tin (từ 0.2.5):** hiển thị phía trên ô nhập, dùng các chức năng gốc của Zalo Web. Khi chụp, cửa sổ Zalo Native và ảnh xem trước cũ được ẩn. Bấm **Đính kèm vào Zalo** để đưa PNG vào cuộc trò chuyện; kiểm tra ảnh rồi tự bấm Gửi.
- **Cài đặt:** điều chỉnh bố cục gọn, ẩn banner, hoặc mở các tuỳ chọn Zalo gốc.

## Kiểm tra tệp tải về

Release có tệp `SHA256SUMS.txt` chứa mã SHA-256 của hai bộ cài và hướng dẫn này. So sánh mã tính trên tệp đã tải với mã trong manifest.

macOS, mở Terminal trong thư mục tải xuống:

```sh
shasum -a 256 Zalo-Native-0.2.1-macOS-arm64.dmg
```

Windows, mở PowerShell trong thư mục tải xuống:

```powershell
Get-FileHash .\Zalo-Native-Setup-0.2.1-Windows-x64.exe -Algorithm SHA256
```

## Cập nhật và dữ liệu

Thoát ứng dụng trước khi cài bản mới. Chỉ thay thế ứng dụng hoặc chạy bộ cài mới; không xoá profile hay dữ liệu ứng dụng nếu muốn giữ phiên đăng nhập. Khi cần, Zalo có thể yêu cầu xác thực lại.

Đây là ứng dụng độc lập chạy Zalo Web, không phải sản phẩm chính thức của Zalo. Các tính năng và dữ liệu đồng bộ phụ thuộc Zalo Web; thay đổi giao diện từ Zalo có thể cần bản cập nhật tương thích.
