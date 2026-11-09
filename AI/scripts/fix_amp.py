import os

checkout_path = r'ECommerceApp\app\checkout.tsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('&amp;', '&')

with open(checkout_path, 'w', encoding='utf-8') as f:
    f.write(c)

print('CHECKOUT_AMP_FIXED')
