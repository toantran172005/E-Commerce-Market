import os
import re

cart_path = r'ECommerceApp\app\cart.tsx'
with open(cart_path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('selected: false,', 'selected: true,')
c = re.sub(
    r'const handleCheckout = \(\) =>\s*\{[\s\S]*?\};',
    'const handleCheckout = () => {\n    router.push("/checkout");\n  };',
    c
)

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(c)

print('CART_CHECKOUT_UPDATED_SUCCESS')
