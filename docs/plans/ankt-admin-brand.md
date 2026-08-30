# Implementation plan: ANKT Admin branding

## Quyết định

- Dùng `viora/assets/images/favicon.png` cho favicon/brand nhỏ và `viora_logo.png` làm nguồn xác thực.
- Giữ tương thích localStorage cũ bằng migration một lần sang key `ankt_admin_*`.
- Sửa màu bảng tại final theme layer với selector đủ mạnh hơn CSS legacy.

## Công việc

### 1. Regression tests

- Thêm test title, favicon, tên ANKT, logo hash và table hover/focus.
- Verify: test phải thất bại trước bản sửa.

### 2. Brand assets và shell

- Đưa logo app vào `public/`, thay logo sidebar/login, title và favicon.
- Verify: test nhận diện pass và build được.

### 3. Namespace và dark table

- Đổi CSS/token hiển thị sang ANKT, migrate storage key và chặn nền trắng khi hover/focus bảng.
- Verify: toàn bộ test, lint, build; kiểm tra Chrome light/dark nếu có session.

### 4. Handoff

- Cập nhật spec/handoff cũ về tên ANKT và ghi giới hạn visual QA.

## Rủi ro

- CSS legacy có specificity cao: override tại stylesheet cuối bằng selector cùng mục đích.
- Đổi storage key có thể làm mất session: đọc key cũ, ghi key mới rồi dọn key cũ sau migration.
