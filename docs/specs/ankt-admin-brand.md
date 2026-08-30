# Spec: Nhận diện ANKT Admin

## Mục tiêu

Chuẩn hóa toàn bộ nhận diện hiển thị của web quản trị theo app ANKT và dùng đúng logo được khai báo trong `viora/app.json`. Khắc phục đồng thời các màu light-theme bị rò sang dark mode, đặc biệt trạng thái hover/focus của bảng.

## Công nghệ và lệnh

- React + TypeScript + Vite, CSS token hiện có.
- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Build: `npm run build`

## Cấu trúc liên quan

- `public/`: logo và favicon ANKT.
- `src/layouts/`, `src/pages/`: nhận diện sidebar và đăng nhập.
- `src/ankt-admin.css`: lớp presentation/theme được import cuối.
- `tests/`: kiểm thử hồi quy nhận diện và theme.

## Quy ước

- Tên hiển thị chính xác là `ANKT Admin`.
- Dùng asset logo chính thức, không vẽ lại hoặc tạo logo mới.
- Mọi màu trạng thái dùng semantic token; không dùng nền sáng cố định trong dark mode.

## Kiểm thử

- So khớp logo public với asset app bằng hash.
- Kiểm tra title, favicon, tên sidebar/login và namespace CSS.
- Kiểm tra hover/focus hàng bảng dùng token theme.
- Smoke test light/dark bằng Chrome khi phiên đăng nhập cho phép.

## Biên

- Luôn: giữ nguyên API, route, quyền và nghiệp vụ.
- Hỏi trước: đổi logo nguồn của app, thêm dependency, thay API.
- Không: tạo logo giả, xóa dữ liệu đăng nhập hoặc sửa backend.

## Tiêu chí hoàn thành

- Sidebar, login, browser title và favicon đều mang nhận diện ANKT.
- Logo web khớp asset chính thức của app.
- Không còn nhận diện Viora hiển thị trên web admin.
- Hover/focus bảng không chuyển thành nền trắng trong dark mode.
- Test, lint và build thành công.

## Câu hỏi mở

- Không có; app config là nguồn xác thực cho tên và logo.
