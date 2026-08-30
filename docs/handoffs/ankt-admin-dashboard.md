# ANKT admin dashboard handoff

## Đã thay đổi

- Dashboard: 4 KPI ưu tiên, bảng tổng hợp vận hành, hàng đợi xử lý và phân bổ nội dung.
- Shell: nhận diện `ANKT Admin`, bỏ ô tìm kiếm/thao tác nhanh không có hành vi, liên kết thông báo thật.
- Theme: palette navy/cyan/violet theo app ANKT, hỗ trợ light/dark.
- Responsive: bỏ giới hạn 768px cũ, KPI 4/2/1 cột, bảng cuộn an toàn, panel xếp lớp trên tablet/mobile.
- Điều hướng: nhóm lại menu theo công việc; tìm trang thật bằng `Ctrl/Cmd + K`, hỗ trợ tiếng Việt không dấu.
- Danh sách: toolbar tìm/lọc/sắp xếp thống nhất, bảng có sticky header, hover và zebra rows nhẹ.
- Bảng quản lý: giảm chữ/padding, cố định độ rộng cột theo vai trò, tự ẩn dữ liệu phụ ở 1280/1080px và dùng card dưới 768px.
- Chi tiết: hồ sơ người dùng được xếp theo thứ tự profile → thống kê → tài khoản/xác thực; bài viết, video và báo cáo dùng vùng nội dung chính + sidebar ngữ cảnh/thao tác.
- Chuỗi ID và nội dung dài được wrap/truncate theo ngữ cảnh; nút xem trong bảng chuyển thành icon có `aria-label`.
- Theme: loại bỏ màu light hard-code khỏi stat card, form, panel, nút và badge; cả light/dark dùng chung token ngữ nghĩa ANKT.
- Branding: sidebar, login, browser title và favicon dùng tên/logo chính thức ANKT; storage key cũ được migrate an toàn.
- Dark table: hover/focus của hàng tương tác dùng token theme, không còn chuyển nền trắng.

## Không thay đổi

- API, contract dữ liệu, route, authentication, quyền và nghiệp vụ quản trị.
- Không thêm dependency hoặc dữ liệu giả.

## Xác minh

- `npm run lint`: pass.
- `npm test`: pass (3 test tìm kiếm điều hướng, 4 test theme/table, 3 test branding/logo).
- `npm run build`: pass.
- `git diff --check`: không có lỗi whitespace (chỉ cảnh báo line ending CRLF của Windows).
- Browser runtime không khả dụng trong phiên làm việc; cần smoke test trực quan tại 320, 768, 1024 và 1440px sau khi chạy local/deploy preview.
