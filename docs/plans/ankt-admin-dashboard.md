# Implementation plan: ANKT admin dashboard

## 1. Cấu trúc thông tin

- Gom dữ liệu API hiện có thành KPI, bảng vận hành và hàng đợi.
- Kiểm tra: TypeScript build.

## 2. Nhận diện và responsive

- Thêm lớp theme CSS cuối, đổi nhận diện shell thành ANKT Admin.
- Chuẩn hóa bảng, breakpoint và overflow ở 320/768/1024/1440px.
- Kiểm tra: lint và build.

## 3. Hoàn thiện

- Thêm tìm kiếm điều hướng thật với `Ctrl/Cmd + K`, bàn phím và route hiện có.
- Sắp lại menu theo ngữ cảnh công việc; chuẩn hóa toolbar, bảng và phân trang.
- Gắn semantic class cho cột bảng để ẩn cột phụ theo breakpoint thay vì phụ thuộc `nth-child`.
- Chia detail thành vùng nội dung chính, sidebar ngữ cảnh và action bar gọn.
- Rà soát diff, trạng thái loading/error, focus và reduced motion.
- Cập nhật handoff; không thay API hay nghiệp vụ.

## Rủi ro

- CSS cũ có nhiều lớp override: cô lập thay đổi trong stylesheet được import cuối.
- Không có test UI/browser trong repo: dùng lint/build và kiểm tra tĩnh; ghi rõ giới hạn visual QA.
