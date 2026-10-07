# Quản lý bài báo riêng

- Thêm mục Bài báo tại `/articles`, chi tiết tại `/articles/:id`.
- Dùng API `/api/admin/articles` cho danh sách, chi tiết, ẩn, khôi phục, xóa.
- Bài viết tiếp tục dùng `/api/admin/posts`; bỏ lọc loại phía client làm sai phân trang.
- Dùng chung bảng, bộ lọc, nội dung chi tiết; nhãn và đường dẫn theo từng mục.
- Giữ tìm kiếm, trạng thái, báo cáo, người đăng, sắp xếp và phân trang phía server.

## Kế hoạch và kiểm chứng
1. Kiểm thử API và cache tách biệt, thêm scope bài báo vào service/hook.
2. Thêm điều hướng và màn hình, kiểm thử mở chi tiết và kiểm duyệt đúng scope.
3. Chạy kiểm thử, lint/build và kiểm tra trình duyệt với dữ liệu giả lập.

Không thay đổi DB hoặc hợp đồng backend: endpoint đã có và giới hạn đúng PostType.
