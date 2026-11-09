# NHIỆM VỤ
Viết file `app/(tabs)/home.tsx` (HomeScreen) khớp thiết kế `home with grid-list style.png`. Import theme từ `../../src/constants/theme`, types từ `../../src/types`.

# BỐ CỤC (trên → dưới, nền #F8F9FB, padding ngang 20, ScrollView dọc)
1. **Header** (row, space-between):
   - Trái: "Good morning" (14, xám) + "Hey, Alex" (26, weight 800, đen).
   - Phải: nút tròn 44 nền trắng viền #ECEEF1 icon `notifications-outline` có chấm đỏ 8px góc trên phải; kế bên nút tròn 44 nền cam icon `bag-handle-outline` trắng (nhấn → `router.push('/checkout')`).
2. **Search row**: ô input cao 52 nền trắng, radius 16, viền #ECEEF1, icon `search-outline` xám, placeholder "Search headphones, phones..."; bên phải nút vuông 52 nền #1A1A1A radius 16 icon `options-outline` trắng.
3. **Banner Flash Sale**: cao ~144, radius 24, nền cam #FF5722 (có thể phủ một View #D9400F opacity 0.35 ở nửa dưới/phải để giả gradient), padding 20. Badge "FLASH SALE" (pill, nền trắng opacity 0.25, chữ trắng 11 bold, letterSpacing 0.5); tiêu đề trắng 26 weight 800 hai dòng "Up to 40% off" / "Audio gear"; nút pill trắng "Shop Now" chữ cam + icon `chevron-forward`.
4. **Categories**: hàng tiêu đề "Categories" (18, 700) trái, "6 products" (xám) phải. Cuộn ngang 4 ô: Audio (`headset-outline`), Phones (`phone-portrait-outline`), Laptops (`laptop-outline`), Accessories (`watch-outline`). Mỗi ô: vuông 64x64 trắng viền #ECEEF1 radius 16 icon cam 26; nhãn 13 bên dưới. Nhấn ô → set activeCategory.
5. **All Products**: tiêu đề "All Products" (18, 700) trái; phải là nút tròn 40 trắng viền, icon `list-outline` khi đang ở grid, `grid-outline` khi ở list (toggle viewMode).
   - Chips cuộn ngang: All, Audio, Phones, Laptops, Accessories. Active: nền #1A1A1A chữ trắng; inactive: nền trắng viền #ECEEF1 chữ #1A1A1A; pill, cao 36, padding ngang 16.
   - Danh sách sản phẩm lọc theo category + search text (không phân biệt hoa thường). Dùng `FlatList` với `scrollEnabled={false}` và `key` thay đổi theo `numColumns` (grid=2 cột, list=1 cột).
   - **ProductCard** (card trắng viền #ECEEF1 radius 16, padding 10):
     - Grid: ảnh vuông radius 12 nền #F3F4F6; List: ảnh 96x96 bên trái, thông tin bên phải (row).
     - Badge giảm giá góc trên-trái ảnh: nền #FF5722 chữ trắng 11 bold radius 8, nội dung `-{Math.round((1 - price/originalPrice)*100)}%` (chỉ hiện khi có originalPrice).
     - Nút tim góc trên-phải ảnh (tròn 30 nền trắng): `heart` đỏ khi favourite, `heart-outline` khi không.
     - Dưới ảnh: thương hiệu (12, xám, lấy từ trường mock `brand`), tên sản phẩm (14, 700, tối đa 2 dòng), hàng cuối: giá `$price` (16, 800) + giá gốc gạch ngang xám 12; rating `star` vàng #F59E0B + số.
     - Nhấn card → `router.push({ pathname: '/product/[id]', params: { id } })`.
   - Chừa `paddingBottom: 100` cho tab bar.

# STATE
`activeCategory: 'All'|'Audio'|'Phones'|'Laptops'|'Accessories'`, `viewMode: 'grid'|'list'`, `search: string`, `favorites: Set<string>` (toggle bằng nhấn tim).

# MOCK DATA (>= 8 sản phẩm, đủ 4 danh mục, kiểu `Product & { brand: string }`)
Ví dụ: AuraBeats Pro Wireless (AuraSound, $249, gốc $299, Audio), Pulse X1 Max (Pulse, Phones, giảm 18%), laptop, smartwatch, earbuds, charger, v.v. `description` ngắn 1 câu, `rating` 4.0-4.9, `stock` > 0.
