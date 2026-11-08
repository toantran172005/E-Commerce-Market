import os
import re

home_path = r'ECommerceApp\app\(tabs)\home.tsx'
with open(home_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace cart button in header
old_cart_button = '''            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.85}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="bag-handle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>'''

new_cart_button = '''            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.85}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>1</Text>
              </View>
            </TouchableOpacity>'''

c = c.replace(old_cart_button, new_cart_button)

# Add cartBadge and cartBadgeText to styles if not present
if 'cartBadge:' not in c:
    styles_addition = '''  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
'''
    c = c.replace('  cartButton: {', styles_addition + '  cartButton: {')

with open(home_path, 'w', encoding='utf-8') as f:
    f.write(c)

print('HOME_CART_ICON_MATCHED_FAVOURITE')
