# Tower Capture Management App

Ứng dụng quản lý việc chụp hình trạm thu phát sóng.\
FE (Next.js web, tối ưu mobile web) và BE (Node.js/Express + MongoDB)
chạy chung trong một project.\
Backend có thể tách riêng ra chạy độc lập sau này.

------------------------------------------------------------------------

## 1. Overview

-   Người dùng đăng nhập để chụp hình trạm.\
-   Mỗi **Trạm (Site)** có thể có nhiều **Type (Hướng/kiểu chụp)**.\
-   Mỗi **Type** chứa nhiều hình ảnh.\
-   Một trạm có thể được chụp nhiều lần vào các ngày khác nhau (để cập
    nhật hiện trạng).\
-   Admin có thể export toàn bộ dữ liệu của user theo ngày.

------------------------------------------------------------------------

## 2. Database Design

### Collections:

#### Users

-   `id`
-   `username`
-   `passwordHash`
-   `role` (user \| admin)

#### Sites

-   `id`
-   `siteCode` (nhập tay)
-   `createdBy`
-   `createdAt`

#### Types

-   `id`
-   `siteId` (FK → Sites)
-   `typeName` (nhập tay)
-   `createdBy`
-   `createdAt`

#### Captures

-   `id`
-   `typeId` (FK → Types)
-   `images` \[array of file url\]
-   `capturedBy`
-   `capturedAt`

------------------------------------------------------------------------

## 3. Main Features

### User

-   Đăng nhập.\
-   Tạo mới **Trạm** (Site).\
-   Tạo mới **Type** trong Trạm.\
-   Upload nhiều hình cho từng Type.\
-   Có thể chụp lại cùng 1 Trạm nhiều lần vào các ngày khác nhau.

### Admin

-   Tất cả chức năng của User.\
-   Export toàn bộ dữ liệu (bao gồm hình ảnh) theo ngày hoặc theo user.\
-   Xóa dữ liệu cũ (theo ngày, theo trạm hoặc theo user).

------------------------------------------------------------------------

## 4. API Design

### Auth

-   `POST /api/auth/login` -- Đăng nhập.

### Site

-   `POST /api/sites` -- Tạo trạm mới.
-   `GET /api/sites` -- Lấy danh sách trạm.

### Type

-   `POST /api/sites/:siteId/types` -- Tạo type mới cho site.
-   `GET /api/sites/:siteId/types` -- Lấy danh sách type trong site.

### Capture

-   `POST /api/types/:typeId/captures` -- Upload hình ảnh.
-   `GET /api/captures?date=YYYY-MM-DD` -- Lấy danh sách capture theo
    ngày.

### Admin

-   `GET /api/admin/export?date=YYYY-MM-DD` -- Export toàn bộ dữ liệu
    trong ngày.
-   `DELETE /api/admin/cleanup?before=YYYY-MM-DD` -- Xóa data cũ.

------------------------------------------------------------------------

## 5. Frontend (Next.js)

### Form Upload (User)

Form đơn giản gồm: - Input: `Site Code` (text)\
- Input: `Type` (text, có thể thêm nhiều type)\
- Upload: chọn nhiều hình\
- Nút Submit

Logic:\
1. Nếu `Site` chưa tồn tại → tạo mới.\
2. Nếu `Type` chưa tồn tại → tạo mới.\
3. Upload hình gắn vào `Type`.

### Admin Page

-   Bộ lọc theo ngày + user.\
-   Nút Export (download JSON/ZIP ảnh).\
-   Nút Delete data cũ.

------------------------------------------------------------------------

## 6. Export Logic

-   Khi export theo ngày, hệ thống gom toàn bộ `captures` có
    `capturedAt` = ngày đó.\
-   Export ra JSON + folder ảnh (hoặc file ZIP).


Cả BE & FE có thể chạy chung trong một folder (ví dụ: `/backend` và
`/frontend`) hoặc tách riêng sau này.

------------------------------------------------------------------------
