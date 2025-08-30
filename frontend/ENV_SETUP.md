# Frontend Environment Setup

## 📋 **Cài đặt Environment Variables**

### **1. Copy Environment File:**
```bash
# Copy example file to local environment
cp env.example .env.local
```

### **2. Cấu hình các biến môi trường:**

#### **Backend API Configuration:**
```bash
# URL backend server
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.42:5000

# API base URL
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.42:5000/api
```

#### **Development Configuration:**
```bash
# Tên ứng dụng
NEXT_PUBLIC_APP_NAME=Tower Capture Management

# Phiên bản
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### **Feature Flags:**
```bash
# Bật/tắt debug logs
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true

# Bật/tắt image preview
NEXT_PUBLIC_ENABLE_IMAGE_PREVIEW=true
```

#### **Upload Configuration:**
```bash
# Kích thước file tối đa (bytes)
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Loại file được phép
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

#### **UI Configuration:**
```bash
# Format ngày mặc định
NEXT_PUBLIC_DEFAULT_DATE_FORMAT=YYYY-MM-DD

# Số item trên mỗi trang
NEXT_PUBLIC_ITEMS_PER_PAGE=20
```

## 🔧 **Sử dụng trong code:**

### **Import config:**
```typescript
import { config } from '@/lib/config'

// Sử dụng
const backendUrl = config.backendUrl
const maxFileSize = config.maxFileSize
```

### **Access environment variables:**
```typescript
// Chỉ có thể access NEXT_PUBLIC_* variables
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
```

## ⚠️ **Lưu ý quan trọng:**

1. **Chỉ `NEXT_PUBLIC_*` variables** mới có thể access từ client-side
2. **File `.env.local`** sẽ được git ignore
3. **Restart dev server** sau khi thay đổi environment variables
4. **Production** cần set environment variables trên hosting platform

## 🚀 **Development vs Production:**

### **Development (.env.local):**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
```

### **Production (hosting platform):**
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-domain.com
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
```

## 📱 **Mobile/LAN Access:**

Để truy cập từ mobile trên cùng LAN:
```bash
NEXT_PUBLIC_BACKEND_URL=http://192.168.1.42:5000
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.42:5000/api
```

Thay `192.168.1.42` bằng IP của máy chủ backend.
