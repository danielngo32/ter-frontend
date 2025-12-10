# Cấu hình Cloudflare DNS cho Subdomain

## Vấn đề
Khi đăng nhập, website chuyển hướng sang subdomain (ví dụ: `abc.ter.vn`), nhưng subdomain này chưa được cấu hình trong Cloudflare DNS, dẫn đến lỗi `DNS_PROBE_FINISHED_NXDOMAIN`.

## Giải pháp: Cấu hình Wildcard DNS Record

### Bước 1: Thêm Wildcard DNS Record trong Cloudflare

1. Đăng nhập vào Cloudflare Dashboard
2. Chọn domain `ter.vn`
3. Vào **DNS** > **Records**
4. Thêm record mới:
   - **Type**: `A` (hoặc `CNAME` nếu dùng Digital Ocean App Platform)
   - **Name**: `*` (wildcard - sẽ match tất cả subdomain)
   - **Target**: 
     - Nếu dùng Digital Ocean Droplet: IP address của droplet
     - Nếu dùng Digital Ocean App Platform: CNAME target (ví dụ: `your-app.ondigitalocean.app`)
   - **Proxy status**: 
     - **DNS only** (không proxy) - nếu cần truy cập trực tiếp
     - **Proxied** (proxy qua Cloudflare) - nếu muốn dùng Cloudflare CDN
   - **TTL**: Auto

### Bước 2: Đảm bảo Digital Ocean App Platform nhận tất cả subdomain

Nếu dùng Digital Ocean App Platform:

1. Vào Digital Ocean Dashboard
2. Chọn App của bạn
3. Vào **Settings** > **Domains**
4. Đảm bảo domain `ter.vn` đã được thêm
5. Thêm wildcard domain `*.ter.vn` (nếu có option)

Hoặc trong App Spec (app.yaml):

```yaml
domains:
  - domain: ter.vn
    type: PRIMARY
  - domain: "*.ter.vn"
    type: ALIAS
```

### Bước 3: Kiểm tra Environment Variables

Đảm bảo trong Digital Ocean App Platform, environment variable `REACT_APP_FRONTEND_URL` được set đúng:

```
REACT_APP_FRONTEND_URL=https://ter.vn
```

### Bước 4: Kiểm tra SSL Certificate

Cloudflare sẽ tự động tạo SSL certificate cho wildcard domain `*.ter.vn` nếu bạn dùng Proxied mode.

Nếu dùng DNS only mode, bạn cần:
- Cấu hình SSL trong Digital Ocean App Platform
- Hoặc dùng Let's Encrypt để tạo wildcard certificate

### Bước 5: Test

1. Đợi DNS propagate (có thể mất vài phút đến vài giờ)
2. Test bằng cách truy cập: `https://abc.ter.vn` (thay `abc` bằng bất kỳ subdomain nào)
3. Kiểm tra xem có redirect đúng không

## Loại bỏ www từ domain

### Cách 1: Sử dụng Cloudflare Page Rules (Khuyến nghị)

1. Vào Cloudflare Dashboard → **Rules** → **Page Rules**
2. Tạo rule mới:
   - **URL**: `www.ter.vn/*`
   - **Setting**: 
     - **Forwarding URL** → **301 - Permanent Redirect**
     - **Destination URL**: `https://ter.vn/$1`
3. Save

### Cách 2: Sử dụng Cloudflare Redirect Rules

1. Vào Cloudflare Dashboard → **Rules** → **Redirect Rules**
2. Tạo rule mới:
   - **Rule name**: Remove www
   - **If**: 
     - **Field**: Hostname
     - **Operator**: equals
     - **Value**: `www.ter.vn`
   - **Then**:
     - **Type**: Dynamic
     - **Status code**: 301
     - **URL**: `https://ter.vn${http.request.uri.path}${http.request.uri.query}`
3. Save

### Cách 3: Code đã tự động redirect

Code trong `App.js` đã tự động redirect từ `www.ter.vn` về `ter.vn`. Tuy nhiên, nên dùng Cloudflare redirect để redirect ở DNS level (nhanh hơn).

## Lưu ý

- Wildcard DNS record `*` sẽ match tất cả subdomain
- Nếu bạn muốn giới hạn subdomain cụ thể, có thể thêm từng record riêng
- Đảm bảo Cloudflare SSL/TLS mode phù hợp với cấu hình của bạn
- **www** sẽ không được coi là subdomain trong code

## Troubleshooting

Nếu vẫn không hoạt động:

1. Kiểm tra DNS propagation: https://dnschecker.org/#A/*.ter.vn
2. Kiểm tra Cloudflare SSL/TLS mode: **Full** hoặc **Full (strict)**
3. Kiểm tra Digital Ocean App Platform logs để xem có lỗi gì không
4. Đảm bảo backend cũng được cấu hình để nhận request từ subdomain

