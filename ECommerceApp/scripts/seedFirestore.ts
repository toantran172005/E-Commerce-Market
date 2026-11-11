/**
 * Master Database Seeder chuẩn hóa 100% theo đúng Sơ đồ ERD (10 bảng) + Notifications:
 * 1. brands
 * 2. categories
 * 3. products
 * 4. product_attributes
 * 5. user_favourites
 * 6. users
 * 7. shipping_addresses
 * 8. orders
 * 9. order_items
 * 10. promos
 * 11. notifications
 *
 * Đồng thời dọn sạch triệt để mọi collection thừa ngoài thiết kế (tickets, shippingMethods, vouchers, faqGroups, faqs, popularSearches).
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  terminate,
} from 'firebase/firestore';
import { db } from '../src/firebaseConfig';
import { MOCK_CATEGORIES } from '../src/mock/categories';
import { MOCK_BRANDS } from '../src/mock/brands';
import { MOCK_PRODUCTS } from '../src/mock/products';
import { MOCK_VOUCHERS } from '../src/mock/vouchers';
import { MOCK_USERS } from '../src/mock/users';
import { MOCK_ADDRESSES } from '../src/mock/addresses';
import { MOCK_ORDERS } from '../src/mock/orders';
import { MOCK_NOTIFICATIONS } from '../src/mock/notifications';

function stripUndefined<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        result[k] = stripUndefined(v);
      }
    }
    return result as T;
  }
  return value;
}

const EXTRA_COLLECTIONS = [
  'tickets',
  'shippingMethods',
  'vouchers',
  'faqGroups',
  'faqs',
  'popularSearches',
  'popularSearch',
];

async function purgeExtras() {
  console.log('🧹 BƯỚC 1: Quét và dọn sạch các collection thừa ngoài 11 collection ERD...');
  for (const colName of EXTRA_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        console.log(`   - Đang xoá ${snap.size} documents trong collection "${colName}"...`);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
    } catch (e: any) {
      console.warn(`   ! Không thể xoá ${colName}:`, e.message);
    }
  }
}

async function seed() {
  console.log('🚀 BẮT ĐẦU CHUẨN HOÁ DATABASE FIRESTORE THEO ĐÚNG 11 COLLECTIONS (ERD + NOTIFICATIONS)...\n');

  // 1. Dọn dẹp collection thừa
  await purgeExtras();

  // 2. Categories (categories)
  console.log(`📦 2. Seeding ${MOCK_CATEGORIES.length} Categories...`);
  const catBatch = writeBatch(db);
  for (const cat of MOCK_CATEGORIES) {
    catBatch.set(doc(db, 'categories', cat.id), {
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'folder-outline',
      productCount: (cat as any).productCount ?? 15,
    });
  }
  await catBatch.commit();

  // 3. Brands (brands)
  console.log(`🏷️ 3. Seeding ${MOCK_BRANDS.length} Brands...`);
  const brandBatch = writeBatch(db);
  for (const brand of MOCK_BRANDS) {
    brandBatch.set(doc(db, 'brands', brand.id), {
      id: brand.id,
      name: brand.name,
    });
  }
  await brandBatch.commit();

  // 4. Products (products) & Product_Attributes (product_attributes)
  console.log(`📱 4. Seeding ${MOCK_PRODUCTS.length} Products và Product_Attributes...`);
  const chunkSize = 300;
  for (let i = 0; i < MOCK_PRODUCTS.length; i += chunkSize) {
    const chunk = MOCK_PRODUCTS.slice(i, i + chunkSize);
    const prodBatch = writeBatch(db);
    for (const prod of chunk) {
      const p = prod as any;
      prodBatch.set(doc(db, 'products', prod.id), {
        id: prod.id,
        categoryId: p.categoryId || prod.category,
        brandId: prod.brandId || 'brand-apple',
        name: prod.name,
        price: prod.price,
        originalPrice: prod.originalPrice || prod.price,
        discountPercent: p.discountPercent || (prod.originalPrice ? Math.round((1 - prod.price / prod.originalPrice) * 100) : 0),
        rating: prod.rating || 5,
        reviewCount: prod.reviewCount || 0,
        stock: prod.stock ?? 50,
        inStock: p.inStock ?? ((prod.stock ?? 1) > 0),
        description: prod.description || '',
        imageUrl: prod.imageUrl || p.image || '',
        isFeatured: p.isFeatured ?? (prod.badge === 'hot'),
        isFlashSale: p.isFlashSale ?? (prod.badge === 'sale'),
        variants: prod.variants || [],
        details: prod.details || [],
      });
    }
    await prodBatch.commit();
  }

  // 5. Product_Attributes (product_attributes)
  console.log('⚙️ 5. Seeding Product_Attributes...');
  const attrBatch = writeBatch(db);
  let attrCount = 0;
  for (const prod of MOCK_PRODUCTS.slice(0, 40)) {
    // 1. Color attribute
    const colorAttrId = `${prod.id}_color`;
    attrBatch.set(doc(db, 'product_attributes', colorAttrId), {
      id: colorAttrId,
      productId: prod.id,
      type: 'color',
      name: 'Màu sắc',
      value: (prod as any).variants?.[0]?.name || 'Đen Titanium',
    });
    attrCount++;

    // 2. Spec/storage attribute
    const specAttrId = `${prod.id}_spec`;
    attrBatch.set(doc(db, 'product_attributes', specAttrId), {
      id: specAttrId,
      productId: prod.id,
      type: 'storage',
      name: 'Phiên bản / Cấu hình',
      value: (prod as any).specs?.storage || 'Tiêu chuẩn 128GB',
    });
    attrCount++;

    // 3. Warranty attribute
    const warAttrId = `${prod.id}_warranty`;
    attrBatch.set(doc(db, 'product_attributes', warAttrId), {
      id: warAttrId,
      productId: prod.id,
      type: 'warranty',
      name: 'Bảo hành',
      value: prod.warrantyPolicy || '12 tháng chính hãng',
    });
    attrCount++;
  }
  await attrBatch.commit();
  console.log(`   + Đã tạo ${attrCount} thuộc tính trong "product_attributes".`);

  // 6. Users (users)
  console.log(`👤 6. Seeding Users...`);
  const userBatch = writeBatch(db);
  for (const u of MOCK_USERS) {
    userBatch.set(doc(db, 'users', u.uid), {
      id: u.uid,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      membershipBadge: 'Khách hàng', // Không dùng 'Thành viên Pro' theo yêu cầu người dùng
      avatarUrl: (u as any).avatarUrl || '',
      orderCount: 4,
      wishlistCount: 3,
      createdAt: u.createdAt || new Date().toISOString(),
    });
  }
  await userBatch.commit();

  // 7. Shipping_Addresses (shipping_addresses)
  console.log(`🏠 7. Seeding Shipping_Addresses...`);
  const addrBatch = writeBatch(db);
  for (const addr of MOCK_ADDRESSES) {
    const targetUid = addr.fullName.includes('Alex') ? 'user-demo' : 'user-mai';
    addrBatch.set(doc(db, 'shipping_addresses', addr.id), {
      id: addr.id,
      userId: targetUid,
      type: addr.label || 'Nhà riêng',
      recipientName: addr.fullName,
      phoneNumber: addr.phone,
      fullAddress: addr.address,
      isDefault: Boolean(addr.isDefault),
    });
    // Đồng bộ subcollection để phục vụ UI
    addrBatch.set(doc(db, 'users', targetUid, 'addresses', addr.id), addr);
  }
  await addrBatch.commit();

  // 8. User_Favourites (user_favourites)
  console.log(`❤️ 8. Seeding User_Favourites...`);
  const favBatch = writeBatch(db);
  const sampleFavProducts = MOCK_PRODUCTS.slice(0, 5);
  for (const prod of sampleFavProducts) {
    const favId = `user-demo_${prod.id}`;
    favBatch.set(doc(db, 'user_favourites', favId), {
      userId: 'user-demo',
      productId: prod.id,
      addedAt: new Date().toISOString(),
    });
    // Đồng bộ subcollection cho UI
    favBatch.set(doc(db, 'users', 'user-demo', 'favourites', prod.id), {
      ...prod,
      addedAt: new Date().toISOString(),
    });
  }
  await favBatch.commit();

  // 9. Promos (promos)
  console.log(`🎟️ 9. Seeding Promos...`);
  const promoBatch = writeBatch(db);
  for (const v of MOCK_VOUCHERS) {
    promoBatch.set(doc(db, 'promos', v.code), {
      ...v,
      code: v.code,
      type: v.type || 'percent',
      value: v.value || 10,
      discountPercent: v.type === 'percent' ? v.value : 10,
      description: (v as any).description || v.title,
      minOrderValue: v.minOrderValue || 100,
      isActive: (v as any).isActive !== false,
    });
  }
  await promoBatch.commit();

  // 10. Orders (orders) & Order_Items (order_items)
  console.log(`🧾 10. Seeding Orders & Order_Items...`);
  const orderBatch = writeBatch(db);
  const orderItemBatch = writeBatch(db);
  let orderItemCount = 0;

  for (const ord of MOCK_ORDERS) {
    orderBatch.set(doc(db, 'orders', ord.id), stripUndefined({
      id: ord.id,
      userId: ord.userId || 'user-demo',
      customerName: ord.customerName || 'Trần Minh Alex',
      phoneNumber: ord.phoneNumber || '+84 901 284 920',
      shippingAddress: ord.shippingAddress || '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
      date: typeof ord.createdAt === 'string' ? ord.createdAt : new Date().toISOString(),
      itemCount: (ord.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
      subtotal: ord.subtotal || 0,
      shippingFee: ord.shippingFee || 0,
      discountAmount: ord.discount || 0,
      totalAmount: ord.totalAmount || 0,
      status: ord.status || 'pending',
      currentStep: ord.status === 'pending' ? 1 : ord.status === 'processing' ? 2 : ord.status === 'shipped' ? 3 : 4,
      canCancel: ord.canCancel !== undefined ? ord.canCancel : ord.status === 'pending',
      cancelReason: ord.cancelReason || '',
      cancelledAt: ord.cancelledAt ? String(ord.cancelledAt) : '',
      paymentMethod: ord.paymentMethodName || 'COD',
      promoCode: ord.voucherCode || '',
      items: ord.items || [],
      timeline: ord.timeline || [],
    }));

    // Seed Order_Items
    (ord.items || []).forEach((it, idx) => {
      const itemId = `${ord.id}_${idx + 1}`;
      const pId = it.productId || (it as any).id || 'prod_default';
      orderItemBatch.set(doc(db, 'order_items', itemId), stripUndefined({
        id: itemId,
        orderId: ord.id,
        productId: pId,
        name: it.name || 'Sản phẩm',
        brand: (it as any).brand || '',
        variant: (it as any).selectedColor || (it as any).variant || it.variantName || '',
        price: it.price || 0,
        originalPrice: (it as any).originalPrice || it.price || 0,
        quantity: it.quantity || 1,
        imageUrl: it.imageUrl || (it as any).image || '',
      }));
      orderItemCount++;
    });
  }
  await orderBatch.commit();
  await orderItemBatch.commit();
  console.log(`   + Đã tạo ${MOCK_ORDERS.length} orders và ${orderItemCount} order_items.`);

  // 11. Notifications (notifications)
  console.log(`🔔 11. Seeding Notifications...`);
  const notifBatch = writeBatch(db);
  for (const ntf of MOCK_NOTIFICATIONS) {
    notifBatch.set(doc(db, 'notifications', ntf.id), {
      id: ntf.id,
      userId: 'user-demo',
      title: ntf.title,
      message: ntf.message,
      isRead: Boolean(ntf.read),
      type: ntf.type || 'order',
      date: ntf.createdAt || new Date().toISOString(),
    });
    // Đồng bộ subcollection cho user-demo
    notifBatch.set(doc(db, 'users', 'user-demo', 'notifications', ntf.id), ntf);
  }
  await notifBatch.commit();

  console.log('\n======================================================');
  console.log('🎉 XÁC MINH SỐ LƯỢNG DOCUMENTS TRONG 11 ROOT COLLECTIONS:');
  const collectionsToCheck = [
    'brands',
    'categories',
    'products',
    'product_attributes',
    'user_favourites',
    'users',
    'shipping_addresses',
    'orders',
    'order_items',
    'promos',
    'notifications',
  ];

  for (const c of collectionsToCheck) {
    const s = await getDocs(collection(db, c));
    console.log(`  ✓ ${c}: ${s.size} documents`);
  }
  console.log('======================================================');
  console.log('✅ Hoàn tất 100% việc chuẩn hóa Firestore theo đúng ERD và Notifications!');

  await terminate(db);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi seed database:', err);
  process.exit(1);
});
