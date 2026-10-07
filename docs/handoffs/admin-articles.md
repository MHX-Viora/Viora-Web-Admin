# Quản lý bài báo trong admin

- Menu Nội dung: Bài viết `/posts`, Bài báo `/articles`, Video ngắn `/videos`.
- Chi tiết bài báo `/articles/:id`, alias `/admin/articles/:id`.
- `PostManagementScope` chọn API và cache `posts` hoặc `articles`; chia sẻ bảng, bộ lọc và trang chi tiết.
- Bài báo dùng `/api/admin/articles` cho danh sách/chi tiết/ẩn/khôi phục/xóa. Backend hiện có kiểm tra `PostType.Article`; không cần migration.
- Bỏ lọc loại phía client; phân trang và tổng số lấy từ API. Nhãn, breadcrumb, quay lại và điều hướng desktop/mobile theo scope.
- Nội dung chi tiết hiển thị các article block theo thứ tự, ảnh/video/chú thích qua component hiện có.

## Kiểm chứng
- `node --test src/pages/*.test.mjs src/components/*.test.mjs`: 21 kiểm thử.
- `npm run lint`, `npm run build`.
- Chrome với dữ liệu giả lập và route thật của App: menu, danh sách bài báo, mở chi tiết, block nội dung, xác nhận ẩn và trạng thái cập nhật; chuyển sang Bài viết gọi API riêng; query `postType=0` không làm mất bài báo; không có lỗi console.
- Không thực hiện kiểm duyệt dữ liệu thật hoặc kiểm thử với tài khoản admin trên server.
- Fixture trình duyệt đã gỡ sau kiểm tra. Build còn cảnh báo kích thước bundle như trước.
