### ROLE & CONTEXT
You are an expert Vietnamese e-commerce copywriter and software engineer.
We need realistic, truthful, non-misleading Vietnamese Shopee-style specifications and descriptions for the 8 core products in `seed.mjs`.
No fake certifications or unproven claims.

Each product must have:
- `categoryPath`: array of strings, e.g. `['Trang chủ', 'Âm thanh', 'Tai nghe chụp tai']`
- `details`: array of `{ label: string, value: string }` matching the category (e.g. Thương hiệu, Bảo hành, Xuất xứ, Trọng lượng, Kết nối, Chất liệu, Thời lượng pin, Chống nước, Kích thước, v.v.)
- `highlights`: array of 4-6 concise Vietnamese bullet highlights
- `longDescription`: detailed, professional product description in Vietnamese (2-3 paragraphs)
- `usageGuide`: practical advice on charging, pairing, maintenance, and storage in Vietnamese
- `warrantyPolicy`: clear official warranty terms (e.g. "Bảo hành 12 tháng chính hãng toàn quốc, 1 đổi 1 trong 30 ngày nếu lỗi sản xuất")
- `origin`: e.g. "Kho tổng E-Commerce, Hà Nội"
- `promotionQuantity`: number, e.g. 50

### INPUT PRODUCTS
1. `prod_aurabeats_pro`: Tai nghe Bluetooth AuraSound Studio Pro Active Noise Cancelling
2. `prod_tempo_watch_pro`: Đồng hồ thông minh Tempo Watch Ultra Titan thể thao chuyên sâu
3. `prod_pulse_11_ultra`: Điện thoại flagship Pulse 11 Ultra 5G camera tiềm vọng 100x
4. `prod_stratus_pro_14`: Laptop cao cấp Stratus Pro 14 Màn hình OLED 3K 120Hz
5. `prod_vortex_gaming`: Tai nghe gaming âm thanh vòm Vortex Surround Sound 7.1
6. `prod_stratus_band`: Vòng đeo tay thông minh theo dõi sức khoẻ Stratus Fit 3
7. `prod_aurasound_mini`: Loa di động không dây chống nước AuraSound BassGo 2
8. `prod_pulse_pad_12`: Máy tính bảng đồ họa Pulse Tab Pro 12 kèm bút cảm ứng

### OUTPUT FORMAT
Output a valid JSON object mapping each product id to its extended attributes:
```json
{
  "prod_aurabeats_pro": { ... },
  ...
}
```
