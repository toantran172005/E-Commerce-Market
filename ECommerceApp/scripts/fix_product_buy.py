import os
import re

prod_path = r'ECommerceApp\app\product\[id].tsx'
with open(prod_path, 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(
    r'const handleBuyNow = \(\) =>\s*\{[\s\S]*?\};',
    'const handleBuyNow = () => {\n    router.push("/checkout");\n  };',
    c
)

c = re.sub(
    r'const handleAddToCart = \(\) =>\s*\{[\s\S]*?\};',
    '''const handleAddToCart = () => {
    Alert.alert(
      'Đã thêm vào giỏ hàng',
      `${product.name} đã được thêm vào giỏ hàng thành công!`,
      [
        { text: 'Tiếp tục xem', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart') }
      ]
    );
  };''',
    c
)

with open(prod_path, 'w', encoding='utf-8') as f:
    f.write(c)

print('PRODUCT_BUY_NOW_UPDATED_SUCCESS')
