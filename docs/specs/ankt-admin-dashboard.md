# Spec: ANKT admin dashboard

## Objective

Biến giao diện quản trị hiện có thành bảng điều hành dễ quét: số liệu quan trọng ở
đầu trang, bảng tổng hợp để so sánh, hàng đợi cần xử lý nổi bật và toàn bộ khung
quản trị đồng bộ nhận diện ANKT.

## Tech stack và lệnh

- React 19, TypeScript, Vite, CSS thuần, TanStack Query, Lucide hiện có.
- Kiểm tra: `npm run lint`
- Unit test: `npm test`
- Build: `npm run build`
- Chạy local: `npm run dev -- --host 127.0.0.1`

## Cấu trúc

- `src/pages/DashboardPage.tsx`: cấu trúc và dữ liệu dashboard.
- `src/layouts/AdminLayout.tsx`: nhận diện và khung điều hướng.
- `src/ankt-admin.css`: lớp theme ANKT, responsive và bảng dữ liệu.
- `docs/handoffs/`: bàn giao thay đổi.

## Quy ước giao diện

- Dùng token CSS; số dùng `tabular-nums`; trạng thái luôn có chữ, không chỉ màu.
- Một accent cyan ANKT, nền navy; màu cảnh báo chỉ dùng cho trạng thái.
- Mobile-first ở 320px; kiểm tra thêm 768px, 1024px và 1440px.

## Kiểm thử

- TypeScript build và ESLint phải sạch.
- Xác minh tĩnh các breakpoint, overflow bảng và trạng thái loading/error.
- Xác minh trình duyệt khi có browser runtime khả dụng.

## Biên

- Luôn: giữ API, route, quyền và thao tác quản trị hiện có.
- Hỏi trước: thêm dependency, đổi API hoặc dữ liệu backend.
- Không: số liệu giả, thay framework, sửa nghiệp vụ ngoài phạm vi UI.

## Tiêu chí hoàn thành

- Dashboard có KPI ưu tiên, bảng tổng hợp và khu vực hàng đợi.
- Bảng quản trị dễ đọc, cuộn ngang an toàn trên màn hình hẹp.
- Sidebar/topbar và light/dark theme mang palette ANKT.
- Tìm kiếm điều hướng hoạt động bằng chuột và bàn phím, không còn control giả.
- Menu được nhóm theo công việc quản trị: vận hành, kiểm duyệt, nội dung, hệ thống.
- Toolbar bảng tách rõ vùng tìm kiếm, bộ lọc và sắp xếp; active filter dễ nhận biết.
- Bảng desktop giữ các cột phục vụ quyết định; cột phụ tự ẩn trên laptop, mobile dùng card.
- Trang detail có cột nội dung chính và cột ngữ cảnh/thao tác; ID dài tự wrap, không đẩy layout.
- Cỡ chữ dữ liệu 11–13px, tiêu đề card 15–17px; nút thao tác bảng dùng icon có nhãn truy cập.
- Không tràn viewport ở 320px; lint và build thành công.

## Tham chiếu thiết kế

- Stripe: tìm kiếm tài nguyên, keyboard shortcut, điều hướng tài nguyên chính.
- Shopify: daily tasks và việc cần làm xuất hiện trước thông tin phụ.
- Vercel: filter trước, drill-down từ overview sang tài nguyên chi tiết.
- Carbon: bảng cần title/toolbar/header/row/pagination rõ; hover giúp quét theo hàng.
