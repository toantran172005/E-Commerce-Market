/* eslint-disable @typescript-eslint/no-explicit-any */

export type ChatIntentName =
  | 'search_products'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'add_to_favourites'
  | 'remove_from_favourites'
  | 'place_order'
  | 'logout'
  | 'policy_question'
  | 'general'
  | 'greeting'
  | 'unknown';

export interface ChatProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
  description?: string;
}

export interface ChatAddress {
  id?: string;
  fullName?: string;
  phone?: string;
  addressLine?: string;
  ward?: string;
  district?: string;
  city?: string;
  isDefault?: boolean;
}

export interface ChatUserContext {
  isGuest: boolean;
  userId?: string;
  displayName?: string;
  email?: string;
  addresses: ChatAddress[];
}

export interface ChatCartItem {
  productId: string;
  quantity: number;
  product?: ChatProduct;
}

export interface ChatOrderItem {
  productId: string;
  quantity: number;
  product?: ChatProduct;
  unitPrice?: number;
}

export interface ChatOrderDraft {
  items: ChatOrderItem[];
  note?: string;
  shippingAddress?: ChatAddress;
  shippingAddressId?: string;
  totalAmount?: number;
}

export interface ChatOrderResult {
  orderId: string;
  code?: string;
  totalAmount?: number;
  message?: string;
}

export type ChatQuickAction =
  | { type: 'login'; label: string }
  | { type: 'add_address'; label: string }
  | { type: 'confirm_order'; label: string; orderDraft: ChatOrderDraft }
  | { type: 'add_to_cart'; label: string; productId: string; quantity?: number }
  | { type: 'add_to_favourites'; label: string; productId: string }
  | { type: 'remove_from_favourites'; label: string; productId: string }
  | { type: 'suggestion'; label: string; value: string };

export interface ChatProductSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface ChatMessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatBotResponse {
  reply: string;
  intent: ChatIntentName;
  products?: ChatProduct[];
  quickActions?: ChatQuickAction[];
  orderDraft?: ChatOrderDraft;
}

export interface ChatBotRuntime {
  user: ChatUserContext;
  cart: {
    addProduct: (product: ChatProduct, quantity?: number) => Promise<void>;
    removeProduct: (productId: string) => Promise<void>;
    getItems: () => ChatCartItem[];
  };
  favourites: {
    addProduct: (product: ChatProduct) => Promise<void>;
    removeProduct: (product: ChatProduct) => Promise<void>;
    toggleProduct: (product: ChatProduct) => Promise<boolean>;
    getProductIds: () => string[];
    getProducts: () => ChatProduct[];
  };
  catalog: {
    searchProducts: (params: ChatProductSearchParams) => Promise<ChatProduct[]>;
    getProductById: (productId: string) => Promise<ChatProduct | null>;
    getAllProducts: () => Promise<ChatProduct[]>;
  };
  orders: {
    createOrder: (draft: ChatOrderDraft) => Promise<ChatOrderResult>;
  };
}

export interface ChatBotRuntimeSources {
  auth?: unknown;
  cart?: unknown;
  favourites?: unknown;
  catalog?: unknown;
  order?: unknown;
  addresses?: unknown;
}

export interface ProcessChatMessageParams {
  message: string;
  history: ChatMessageHistory[];
  runtime: ChatBotRuntime;
}

interface ChatIntent {
  reply: string;
  intent: ChatIntentName;
  productQuery?: ChatProductSearchParams;
  productId?: string;
  productName?: string;
  productIds?: string[];
  quantity?: number;
  note?: string;
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekApiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

type UnknownMethod = (...args: unknown[]) => unknown;

const CHAT_INTENTS: ChatIntentName[] = [
  'search_products',
  'add_to_cart',
  'remove_from_cart',
  'add_to_favourites',
  'remove_from_favourites',
  'place_order',
  'logout',
  'policy_question',
  'general',
  'greeting',
  'unknown',
];

const getEnvKey = (): string => {
  try {
    const envVal =
      (process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY as string | undefined) ||
      (process.env.DEEPSEEK_API_KEY as string | undefined);
    if (envVal && envVal.trim()) return envVal.trim();
  } catch {
    // ignore
  }
  return 'sk-8e6d65aff0ae461fa0385ea32d1fd7c5';
};

const DEEPSEEK_API_KEY = getEnvKey();

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function readProperty<T>(source: unknown, keys: string | string[], fallback: T): T {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const record = asRecord(source);
  if (!record) return fallback;

  for (const key of keyList) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return fallback;
}

function getMethod(source: unknown, names: string[]): UnknownMethod | undefined {
  const record = asRecord(source);
  if (!record) return undefined;

  for (const name of names) {
    const value = record[name];
    if (typeof value === 'function') {
      return value.bind(source) as UnknownMethod;
    }
  }

  return undefined;
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function formatCurrencyVND(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return `${safeValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}

export function normalizeVietnamese(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeProduct(value: unknown): ChatProduct | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = toStringValue(record.id ?? record._id ?? record.productId ?? record.uid);
  const name = toStringValue(record.name ?? record.title ?? record.productName);
  if (!id || !name) return null;

  const imageList = Array.isArray(record.images) ? record.images : [];
  const firstImage = imageList.find((item): item is string => typeof item === 'string');
  const imageUrl = toStringValue(
    record.imageUrl ??
      record.image ??
      record.thumbnail ??
      record.photoUrl ??
      firstImage
  );
  const category = toStringValue(
    record.categoryName ?? record.category ?? record.categoryId
  );
  const description = toStringValue(
    record.description ?? record.shortDescription
  );
  const stock = toNumberValue(
    record.stock ?? record.quantity ?? record.inventory
  );
  const price =
    toNumberValue(
      record.price ?? record.salePrice ?? record.unitPrice ?? record.finalPrice
    ) ?? 0;

  return {
    id,
    name,
    price,
    imageUrl: imageUrl || undefined,
    category: category || undefined,
    stock,
    description: description || undefined,
  };
}

function normalizeProducts(value: unknown): ChatProduct[] {
  if (Array.isArray(value)) {
    return value
      .map(normalizeProduct)
      .filter((product): product is ChatProduct => product !== null);
  }

  const record = asRecord(value);
  if (record) {
    const nested = record.products ?? record.items ?? record.data ?? record.results;
    if (Array.isArray(nested)) {
      return normalizeProducts(nested);
    }
  }

  return [];
}

function normalizeAddress(value: unknown): ChatAddress | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = toStringValue(record.id ?? record._id ?? record.addressId);
  const fullName = toStringValue(
    record.fullName ?? record.name ?? record.receiverName
  );
  const phone = toStringValue(record.phone ?? record.phoneNumber);
  const addressLine = toStringValue(
    record.addressLine ?? record.address ?? record.street ?? record.detail
  );
  const ward = toStringValue(record.ward ?? record.wardName);
  const district = toStringValue(record.district ?? record.districtName);
  const city = toStringValue(
    record.city ?? record.cityName ?? record.province ?? record.provinceName
  );
  const isDefaultValue = record.isDefault ?? record['default'];
  const isDefault =
    typeof isDefaultValue === 'boolean' ? isDefaultValue : undefined;

  if (!id && !fullName && !addressLine) return null;

  return {
    id: id || undefined,
    fullName: fullName || undefined,
    phone: phone || undefined,
    addressLine: addressLine || undefined,
    ward: ward || undefined,
    district: district || undefined,
    city: city || undefined,
    isDefault,
  };
}

function normalizeAddresses(value: unknown): ChatAddress[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeAddress)
    .filter((address): address is ChatAddress => address !== null);
}

function normalizeCartItems(value: unknown): ChatCartItem[] {
  const list = Array.isArray(value) ? value : [];
  const items: ChatCartItem[] = [];

  for (const entry of list) {
    const record = asRecord(entry);
    if (!record) continue;

    const product =
      normalizeProduct(record.product ?? record.productData ?? record.item) ??
      normalizeProduct(record);
    const productId = toStringValue(
      record.productId ?? record.id ?? product?.id
    );
    const quantity =
      toNumberValue(record.quantity ?? record.qty ?? record.count) ?? 1;

    if (!productId) continue;

    items.push({
      productId,
      quantity,
      product: product ?? undefined,
    });
  }

  return items;
}

function normalizeUser(auth: unknown, addressesOverride?: unknown): ChatUserContext {
  const user = readProperty<unknown>(
    auth,
    ['user', 'currentUser', 'profile', 'session'],
    null
  );
  const userRecord = asRecord(user);
  const rawAddresses =
    addressesOverride ?? userRecord?.addresses ?? readProperty<unknown>(auth, ['addresses'], []);
  const addresses = normalizeAddresses(rawAddresses);
  const userId = toStringValue(
    userRecord?.id ??
      userRecord?.uid ??
      readProperty<unknown>(auth, ['userId', 'uid'], '')
  );
  const displayName = toStringValue(
    userRecord?.displayName ??
      userRecord?.fullName ??
      userRecord?.name ??
      readProperty<unknown>(auth, ['displayName', 'name'], '')
  );
  const email = toStringValue(
    userRecord?.email ?? readProperty<unknown>(auth, ['email'], '')
  );
  const guestValue = readProperty<unknown>(auth, ['isGuest'], false);
  const isGuestFlag = guestValue === true || guestValue === 'true' || userRecord?.isGuest === true;
  const isGuest = isGuestFlag || !userRecord || !userId;

  return {
    isGuest,
    userId: userId || undefined,
    displayName: displayName || (email ? email.split('@')[0] : undefined),
    email: email || undefined,
    addresses,
  };
}

function createCartMethods(cartSource: unknown): {
  addProduct: ChatBotRuntime['cart']['addProduct'];
  removeProduct: ChatBotRuntime['cart']['removeProduct'];
} {
  const addMethod = getMethod(cartSource, [
    'addProduct',
    'addItem',
    'addToCart',
    'add',
  ]);
  const removeMethod = getMethod(cartSource, [
    'removeFromCart',
    'removeItem',
    'remove',
    'deleteItem',
  ]);

  return {
    addProduct: async (product, quantity = 1) => {
      if (!addMethod) throw new Error('Giỏ hàng chưa sẵn sàng.');
      try {
        await Promise.resolve(addMethod(product, quantity));
      } catch (error) {
        try {
          await Promise.resolve(addMethod(product.id, quantity));
        } catch {
          throw error;
        }
      }
    },
    removeProduct: async (productId: string) => {
      if (!removeMethod) return;
      try {
        await Promise.resolve(removeMethod(productId));
      } catch {
        // ignore
      }
    },
  };
}

function createFavouriteMethods(favouritesSource: unknown): {
  addProduct: ChatBotRuntime['favourites']['addProduct'];
  removeProduct: ChatBotRuntime['favourites']['removeProduct'];
  toggleProduct: ChatBotRuntime['favourites']['toggleProduct'];
  getProductIds: () => string[];
  getProducts: () => ChatProduct[];
} {
  const getProductsList = (): ChatProduct[] => {
    const rawItems = readProperty<unknown>(
      favouritesSource,
      ['favourites', 'favorites', 'items'],
      []
    );
    if (Array.isArray(rawItems)) {
      return normalizeProducts(rawItems);
    }
    return [];
  };

  const getProductIds = (): string[] => {
    const directIds = readProperty<unknown>(
      favouritesSource,
      ['productIds', 'favouriteIds', 'favoriteIds', 'ids'],
      []
    );
    if (Array.isArray(directIds) && directIds.length > 0) {
      return directIds.map(toStringValue).filter(Boolean);
    }
    const products = getProductsList();
    return products.map((p) => p.id);
  };

  const toggleMethod = getMethod(favouritesSource, [
    'toggleFavourite',
    'toggleFavorite',
    'toggle',
    'toggleProduct',
  ]);
  const addMethod = getMethod(favouritesSource, [
    'addFavourite',
    'addFavorite',
    'addToFavourites',
    'addToFavorites',
    'add',
  ]);
  const removeMethod = getMethod(favouritesSource, [
    'removeFavourite',
    'removeFavorite',
    'removeFromFavourites',
    'remove',
  ]);

  return {
    getProducts: getProductsList,
    getProductIds,
    addProduct: async (product: ChatProduct) => {
      const ids = getProductIds();
      if (ids.includes(product.id)) return;
      if (addMethod) {
        try {
          await Promise.resolve(addMethod(product));
          return;
        } catch {
          await Promise.resolve(addMethod(product.id));
          return;
        }
      }
      if (toggleMethod) {
        await Promise.resolve(toggleMethod(product));
      }
    },
    removeProduct: async (product: ChatProduct) => {
      const ids = getProductIds();
      if (!ids.includes(product.id) && ids.length > 0) return;
      if (removeMethod) {
        try {
          await Promise.resolve(removeMethod(product));
          return;
        } catch {
          await Promise.resolve(removeMethod(product.id));
          return;
        }
      }
      if (toggleMethod) {
        await Promise.resolve(toggleMethod(product));
      }
    },
    toggleProduct: async (product: ChatProduct) => {
      const ids = getProductIds();
      const currentlyFav = ids.includes(product.id);
      if (toggleMethod) {
        try {
          const result = await Promise.resolve(toggleMethod(product));
          if (typeof result === 'boolean') return result;
          return !currentlyFav;
        } catch {
          const result = await Promise.resolve(toggleMethod(product.id));
          if (typeof result === 'boolean') return result;
          return !currentlyFav;
        }
      }
      if (currentlyFav && removeMethod) {
        await Promise.resolve(removeMethod(product));
        return false;
      }
      if (!currentlyFav && addMethod) {
        await Promise.resolve(addMethod(product));
        return true;
      }
      return !currentlyFav;
    },
  };
}

function filterProducts(
  products: ChatProduct[],
  params: ChatProductSearchParams
): ChatProduct[] {
  const rawQuery = params.query ? normalizeVietnamese(params.query) : '';
  const categoryParam = params.category ? normalizeVietnamese(params.category) : '';

  const queryTokens = rawQuery
    ? rawQuery.split(/\s+/).filter((t) => t.length > 1)
    : [];

  return products.filter((product) => {
    // 1. Price check
    if (params.minPrice !== undefined && product.price < params.minPrice) {
      return false;
    }
    if (params.maxPrice !== undefined && product.price > params.maxPrice) {
      return false;
    }

    const prodName = normalizeVietnamese(product.name);
    const prodCategory = normalizeVietnamese(product.category ?? '');
    const prodDesc = normalizeVietnamese(product.description ?? '');
    const haystack = `${prodName} ${prodCategory} ${prodDesc}`;

    // 2. Category check
    if (categoryParam) {
      const catMatch =
        prodCategory.includes(categoryParam) ||
        categoryParam.includes(prodCategory) ||
        haystack.includes(categoryParam);
      if (!catMatch) {
        return false;
      }
    }

    // 3. Query check
    if (rawQuery) {
      if (haystack.includes(rawQuery)) return true;

      if (queryTokens.length > 0) {
        const matchesAll = queryTokens.every((token) => haystack.includes(token));
        if (matchesAll) return true;

        const matchCount = queryTokens.filter((token) => haystack.includes(token)).length;
        if (matchCount >= Math.ceil(queryTokens.length / 2)) {
          return true;
        }
      }
      return false;
    }

    return true;
  });
}

function createCatalogMethods(catalogSource: unknown): {
  searchProducts: ChatBotRuntime['catalog']['searchProducts'];
  getProductById: ChatBotRuntime['catalog']['getProductById'];
  getAllProducts: ChatBotRuntime['catalog']['getAllProducts'];
} {
  const searchMethod = getMethod(catalogSource, [
    'searchProducts',
    'search',
    'filterProducts',
    'getProducts',
    'getAllProducts',
  ]);

  const getterMethod = getMethod(catalogSource, [
    'getProductById',
    'getProduct',
    'findProductById',
    'findById',
  ]);

  const getAllProducts = async (): Promise<ChatProduct[]> => {
    if (!searchMethod) return [];
    try {
      const raw = await Promise.resolve(searchMethod({ limit: 60 }));
      const prods = normalizeProducts(raw);
      if (prods.length > 0) return prods;
    } catch {
      // ignore
    }
    try {
      const raw = await Promise.resolve(searchMethod());
      return normalizeProducts(raw);
    } catch {
      return [];
    }
  };

  const searchProducts = async (params: ChatProductSearchParams): Promise<ChatProduct[]> => {
    const all = await getAllProducts();
    const filtered = filterProducts(all, params);
    return filtered.slice(0, params.limit ?? 5);
  };

  const getProductById = async (productId: string): Promise<ChatProduct | null> => {
    if (getterMethod) {
      try {
        const raw = await Promise.resolve(getterMethod(productId));
        const prod = normalizeProduct(raw);
        if (prod) return prod;
      } catch {
        // ignore
      }
    }
    const all = await getAllProducts();
    return all.find((p) => p.id === productId) ?? null;
  };

  return {
    searchProducts,
    getProductById,
    getAllProducts,
  };
}

function normalizeOrderResult(value: unknown): ChatOrderResult {
  const record = asRecord(value);
  const orderRecord = asRecord(record?.order);
  const target = orderRecord ?? record;
  const orderId = toStringValue(
    target?.id ?? target?.orderId ?? target?._id ?? record?.orderId
  );
  const code = toStringValue(
    target?.code ?? target?.orderCode ?? target?.codeOrder
  );
  const totalAmount = toNumberValue(
    target?.totalAmount ??
      target?.total ??
      target?.grandTotal ??
      record?.totalAmount
  );
  const message = toStringValue(record?.message ?? target?.message);

  return {
    orderId: orderId || 'unknown',
    code: code || undefined,
    totalAmount,
    message: message || undefined,
  };
}

function createOrderMethod(
  orderSource: unknown,
  user?: ChatUserContext
): ChatBotRuntime['orders']['createOrder'] {
  const orderFn = getMethod(orderSource, ['createOrder']);

  return async (draft) => {
    if (!orderFn) {
      throw new Error('Dịch vụ đơn hàng chưa sẵn sàng.');
    }

    const addr = draft.shippingAddress;
    const fullAddressText = addr
      ? [addr.fullName, addr.phone, addr.addressLine, addr.ward, addr.district, addr.city]
          .filter(Boolean)
          .join(', ')
      : 'Địa chỉ nhận hàng';

    const payload = {
      userId: user?.userId || '',
      customerName: addr?.fullName || user?.displayName || 'Khách hàng',
      phoneNumber: addr?.phone || '0901234567',
      shippingAddress: fullAddressText,
      items: draft.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.product?.name ?? item.productId,
        price: item.unitPrice ?? item.product?.price ?? 0,
        imageUrl: item.product?.imageUrl ?? '',
      })),
      note: draft.note,
      totalAmount: draft.totalAmount,
    };

    let rawResult: unknown;
    try {
      rawResult = await Promise.resolve(orderFn(payload));
    } catch {
      rawResult = await Promise.resolve(
        orderFn(payload.items, payload.shippingAddress, payload.note)
      );
    }

    return normalizeOrderResult(rawResult);
  };
}

export function createChatBotRuntime(
  sources: ChatBotRuntimeSources
): ChatBotRuntime {
  const user = normalizeUser(sources.auth, sources.addresses);
  const cartMethods = createCartMethods(sources.cart);
  const favMethods = createFavouriteMethods(sources.favourites);
  const catalogMethods = createCatalogMethods(sources.catalog);
  const createOrder = createOrderMethod(sources.order, user);

  return {
    user,
    cart: {
      addProduct: cartMethods.addProduct,
      removeProduct: cartMethods.removeProduct,
      getItems: () =>
        normalizeCartItems(
          readProperty<unknown>(
            sources.cart,
            ['items', 'cartItems', 'products'],
            []
          )
        ),
    },
    favourites: favMethods,
    catalog: catalogMethods,
    orders: {
      createOrder,
    },
  };
}

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start < 0 || end <= start) {
    throw new Error('DeepSeek trả về JSON không hợp lệ.');
  }

  const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
  const record = asRecord(parsed);

  if (!record) {
    throw new Error('DeepSeek trả về JSON không phải object.');
  }

  return record;
}

function normalizeIntent(raw: Record<string, unknown>): ChatIntent {
  const reply =
    toStringValue(raw.reply ?? raw.message ?? raw.content) ||
    'Mình đã ghi nhận yêu cầu của bạn.';
  const rawIntent = toStringValue(raw.intent).toLowerCase().trim();

  let productIds: string[] | undefined;
  if (Array.isArray(raw.productIds)) {
    productIds = raw.productIds.map(toStringValue).filter(Boolean);
  } else if (Array.isArray(raw.matchedProductIds)) {
    productIds = raw.matchedProductIds.map(toStringValue).filter(Boolean);
  }

  let intent: ChatIntentName = 'general';
  if (CHAT_INTENTS.includes(rawIntent as ChatIntentName)) {
    intent = rawIntent as ChatIntentName;
  } else if (
    rawIntent.includes('search') ||
    rawIntent.includes('find') ||
    rawIntent.includes('filter') ||
    rawIntent.includes('product') ||
    (productIds && productIds.length > 0)
  ) {
    intent = 'search_products';
  } else if (rawIntent.includes('add') && (rawIntent.includes('cart') || rawIntent.includes('gio'))) {
    intent = 'add_to_cart';
  } else if (rawIntent.includes('remove') && (rawIntent.includes('cart') || rawIntent.includes('gio'))) {
    intent = 'remove_from_cart';
  } else if (rawIntent.includes('remove') && (rawIntent.includes('fav') || rawIntent.includes('thich'))) {
    intent = 'remove_from_favourites';
  } else if (rawIntent.includes('fav') || rawIntent.includes('thich')) {
    intent = 'add_to_favourites';
  } else if (rawIntent.includes('order') || rawIntent.includes('buy') || rawIntent.includes('dat')) {
    intent = 'place_order';
  } else if (rawIntent.includes('logout') || rawIntent.includes('thoat') || rawIntent.includes('dang xuat')) {
    intent = 'logout';
  } else if (rawIntent.includes('policy') || rawIntent.includes('chinh sach')) {
    intent = 'policy_question';
  } else if (rawIntent.includes('greet') || rawIntent.includes('chao')) {
    intent = 'greeting';
  }

  const productQueryRecord = asRecord(raw.productQuery);
  const productQuery = productQueryRecord
    ? {
        query: toStringValue(productQueryRecord.query) || undefined,
        category: toStringValue(productQueryRecord.category) || undefined,
        minPrice: toNumberValue(productQueryRecord.minPrice),
        maxPrice: toNumberValue(productQueryRecord.maxPrice),
        limit: toNumberValue(productQueryRecord.limit) ?? 5,
      }
    : undefined;

  return {
    reply,
    intent,
    productQuery,
    productId: toStringValue(raw.productId) || undefined,
    productName: toStringValue(raw.productName) || undefined,
    productIds,
    quantity: toNumberValue(raw.quantity) ?? 1,
    note: toStringValue(raw.note) || undefined,
  };
}

async function buildSystemPrompt(runtime: ChatBotRuntime): Promise<string> {
  const cartItems = runtime.cart.getItems();
  const cartSummary = cartItems.length
    ? cartItems
        .map(
          (item) =>
            `- ${item.product?.name ?? item.productId} x${item.quantity}: ${formatCurrencyVND(
              (item.product?.price ?? 0) * item.quantity
            )}`
        )
        .join('\n')
    : 'Giỏ hàng đang trống.';

  const favourites = runtime.favourites.getProducts();
  const favSummary = favourites.length
    ? favourites
        .map(
          (product) =>
            `- [Mã/ID: ${product.id}] ${product.name} | Giá: ${formatCurrencyVND(
              product.price
            )} | Danh mục: ${product.category || 'N/A'}`
        )
        .join('\n')
    : 'Chưa có sản phẩm nào trong danh sách yêu thích.';

  const addressSummary = runtime.user.addresses.length
    ? runtime.user.addresses
        .map((address) =>
          [address.fullName, address.phone, address.addressLine, address.ward, address.district, address.city]
            .filter(Boolean)
            .join(', ')
        )
        .join('\n')
    : 'Chưa có địa chỉ nhận hàng.';

  let catalogProducts: ChatProduct[] = [];
  try {
    catalogProducts = await runtime.catalog.getAllProducts();
  } catch {
    // ignore
  }

  const catalogSummary = catalogProducts
    .slice(0, 40)
    .map(
      (p) =>
        `- ID: "${p.id}", Tên: "${p.name}", Giá: ${p.price} VNĐ (${formatCurrencyVND(
          p.price
        )}), Danh mục: "${p.category || 'Khác'}"`
    )
    .join('\n');

  return `Bạn là "Trợ Lý AI" thông minh, hiểu biết sâu rộng và tận tâm của ứng dụng E-Commerce Shoppe.
Phong cách giao tiếp: Tự nhiên, thông thái, dí dỏm, ngắn gọn, xưng "mình" và gọi khách là "bạn". Bạn có thể giải đáp MỌI câu hỏi từ tư vấn công nghệ chuyên sâu (học lập trình/thiết kế nên dùng laptop nào, so sánh sản phẩm, giải thích thông số...), chia sẻ kinh nghiệm, chém gió thân thiện cho đến chăm sóc khách hàng.

THÔNG TIN NGƯỜI DÙNG & TÀI KHOẢN:
- Trạng thái: ${
    runtime.user.isGuest
      ? 'KHÁCH (Chưa đăng nhập)'
      : `KHÁCH HÀNG ĐÃ ĐĂNG NHẬP (${runtime.user.displayName || runtime.user.email || 'Thành viên'})`
  }
- Địa chỉ nhận hàng:
${addressSummary}
- Giỏ hàng hiện tại:
${cartSummary}
- DANH SÁCH SẢN PHẨM YÊU THÍCH HIỆN CÓ CỦA BẠN NÀY (HÃY GHI NHỚ KỸ CẢ CŨ LẪN MỚI):
${favSummary}

DANH MỤC SẢN PHẨM CỬA HÀNG ĐANG CÓ (Chỉ được chọn từ đây):
${catalogSummary || 'Chưa tải được danh mục.'}

QUY TẮC XỬ LÝ QUAN TRỌNG:
1. HIỂU ĐÚNG NGỮ CẢNH HỘI THOẠI & PHẢN HỒI THÔNG MINH:
- Nếu người dùng thắc mắc, hỏi lại hoặc sửa lưng bạn (ví dụ: "cái đấy là vòng đeo tay và điện thoại mà?", "sao tôi hỏi laptop mà gợi ý điện thoại?"):
  -> Hãy thẳng thắn nhận lỗi, xin lỗi vì gợi ý nhầm và trả lời đúng trọng tâm câu hỏi của khách hàng. Tuyệt đối không trả lời máy móc hay lặp lại các câu mặc định!
- Nếu người dùng tìm kiếm sản phẩm với tiêu chí cụ thể (ví dụ: "laptop dưới 15 triệu"):
  -> Kiểm tra kỹ danh mục sản phẩm ở trên. Nếu KHÔNG CÓ laptop nào dưới 15 triệu, hãy nói thật rõ ràng và lịch sự: "Hiện tại cửa hàng mình chưa có mẫu laptop nào có mức giá dưới 15 triệu. Cửa hàng hiện có [tên laptop và giá nếu có], bạn có muốn tham khảo không?". TUYỆT ĐỐI KHÔNG trả về các sản phẩm khác loại như vòng đeo tay hay điện thoại rồi bảo đó là laptop!

2. QUẢN LÝ SẢN PHẨM YÊU THÍCH:
- Danh sách yêu thích của người dùng đã được liệt kê chi tiết ở trên ("DANH SÁCH SẢN PHẨM YÊU THÍCH HIỆN CÓ"). Bạn nhìn thấy TOÀN BỘ các sản phẩm này (kể cả cũ lẫn mới).
- Khi người dùng bảo xóa sản phẩm yêu thích (ví dụ: "xóa sản phẩm kia", "xóa laptop khỏi yêu thích", "bỏ thích sản phẩm A"):
  -> So khớp với danh sách yêu thích ở trên. Tìm đúng sản phẩm người dùng muốn xóa.
  -> Trả về intent "remove_from_favourites", gán "productId" và "productName" đúng của sản phẩm cần xóa, kèm câu trả lời "Mình đã xóa [Tên sản phẩm] khỏi danh sách yêu thích của bạn."
  -> Nếu không rõ người dùng muốn xóa sản phẩm nào trong số các sản phẩm yêu thích, hãy liệt kê tên các sản phẩm đang có trong yêu thích và hỏi người dùng muốn xóa món nào.

3. PHÂN QUYỀN GUEST / KHÁCH & ĐĂNG XUẤT:
- Khi người dùng yêu cầu đăng xuất (ví dụ: "đăng xuất", "đăng xuất tài khoản", "logout", "thoát tài khoản"):
  -> Nếu đã đăng nhập: Trả lời câu chào tạm biệt thân thiện: "Mình đã đăng xuất tài khoản thành công cho bạn rồi nhé. Hẹn gặp lại bạn sớm!", với intent: "logout".
  -> Nếu là KHÁCH (chưa đăng nhập): Trả lời: "Bạn hiện đang ở chế độ khách vãng lai (chưa đăng nhập) nên không cần đăng xuất nhé!".
- Nếu là KHÁCH (chưa đăng nhập) mà yêu cầu thêm vào giỏ, thêm/xóa yêu thích hoặc đặt hàng: Lịch sự nhắc họ cần đăng nhập để thực hiện.

4. XỬ LÝ YÊU CẦU NHẠY CẢM HOẶC KHÔNG THỂ XỬ LÝ:
- TUYỆT ĐỐI KHÔNG BAO GIỜ trả lời câu máy móc như "Mình đã ghi nhận yêu cầu của bạn".
- Nếu người dùng yêu cầu đưa API key, mật khẩu, code backend, hack hệ thống: Hãy lịch sự từ chối và xin lỗi: "Xin lỗi bạn, vì lý do bảo mật và an toàn thông tin, mình không thể cung cấp API key hoặc thông tin quản trị hệ thống."
- Nếu người dùng hỏi điều ngoài khả năng hoặc không thể hỗ trợ: Hãy thành thật xin lỗi và giải thích rõ lý do một cách tự nhiên.

5. ĐỊNH DẠNG TRẢ VỀ:
BẮT BUỘC trả về một JSON object duy nhất, không bọc markdown \`\`\`json:
{
  "reply": "câu trả lời tự nhiên, thân thiện và chính xác cho khách hàng",
  "intent": "search_products|add_to_cart|remove_from_cart|add_to_favourites|remove_from_favourites|place_order|logout|policy_question|general|greeting",
  "productId": "id của sản phẩm nếu áp dụng thao tác (thêm/xóa/xem)",
  "productName": "tên sản phẩm tương ứng",
  "productIds": ["id1", "id2"],
  "productQuery": {
    "query": "từ khóa tìm kiếm",
    "category": "danh mục nếu có",
    "minPrice": null,
    "maxPrice": 15000000,
    "limit": 5
  },
  "quantity": 1,
  "note": "ghi chú đơn hàng nếu có"
}`;
}

async function callDeepSeek(
  apiKey: string,
  messages: DeepSeekMessage[]
): Promise<ChatIntent> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DeepSeek API ${response.status}: ${errorText.slice(0, 200)}`
    );
  }

  const raw: unknown = await response.json();
  const data = raw as DeepSeekApiResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(data.error?.message ?? 'DeepSeek không trả về nội dung.');
  }

  return normalizeIntent(parseJsonObject(content));
}

function extractCleanQuery(message: string): { query: string; category?: string } {
  const norm = normalizeVietnamese(message);

  let category: string | undefined;
  if (/(tai nghe|headphone|earphone|buds|airpods|am thanh)/i.test(norm)) {
    category = 'Âm thanh';
  } else if (/(laptop|macbook|may tinh xach tay)/i.test(norm)) {
    category = 'Laptop & Máy tính';
  } else if (/(dien thoai|smartphone|iphone|galaxy s|xiaomi 14|zenfone)/i.test(norm)) {
    category = 'Điện thoại';
  } else if (/(may tinh bang|tablet|ipad|tab s|pad 6)/i.test(norm)) {
    category = 'Máy tính bảng';
  } else if (/(dong ho|smartwatch|vong deo tay|smart band|watch)/i.test(norm)) {
    category = 'Đồng hồ thông minh';
  } else if (/(chuot|ban phim|keyboard|mouse|phu kien|gear)/i.test(norm)) {
    category = 'Phụ kiện & Gear';
  }

  const cleaned = norm
    .replace(
      /\b(toi|minh|ban|shop|ad|em|anh|chi|muon|can|xem|tim|kiem|loc|hoi|cho|gui|cac|vai|nhung|mot so|mau|loai|san pham|hang|co|khong|chua|nao|gi|bao nhieu|nhe|nha|ạ|a|ha|giup|voi|hay|vui long|o day|cua hang|hien tai|dang co)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  return {
    query: cleaned || (category ? category : norm),
    category,
  };
}

function extractProductQuery(message: string): string {
  return extractCleanQuery(message).query;
}

function fallbackIntent(message: string, runtime: ChatBotRuntime): ChatIntent {
  const normalized = normalizeVietnamese(message);
  const extracted = extractCleanQuery(message);
  let intent: ChatIntentName = 'general';
  let reply = '';

  if (/(dang xuat|thoat tai khoan|log out|logout)/.test(normalized)) {
    intent = 'logout';
    reply = runtime.user.isGuest
      ? 'Bạn hiện đang duyệt ở chế độ khách vãng lai nên không cần đăng xuất nhé!'
      : 'Mình đã đăng xuất tài khoản thành công cho bạn rồi nhé. Hẹn gặp lại bạn sớm!';
  } else if (/(api key|apikey|secret key|token|mat khau|password)/.test(normalized)) {
    intent = 'general';
    reply = 'Xin lỗi bạn, vì lý do an toàn và bảo mật thông tin, mình không thể cung cấp API key hay dữ liệu quản trị của hệ thống.';
  } else if (/(xin chao|chao|hello|hi)\b/.test(normalized)) {
    intent = 'greeting';
    reply = 'Xin chào bạn! Mình là Trợ Lý AI, mình có thể giúp gì cho bạn hôm nay?';
  } else if (/(dat hang|dat don|mua hang|order|thanh toan)/.test(normalized)) {
    intent = 'place_order';
    reply = 'Mình sẽ chuẩn bị thông tin đơn hàng cho bạn ngay đây.';
  } else if (/(xoa|bo|remove|go).*(yeu thich|favorite|thich)/.test(normalized)) {
    intent = 'remove_from_favourites';
    reply = 'Mình sẽ kiểm tra và xóa sản phẩm khỏi danh sách yêu thích cho bạn.';
  } else if (/(yeu thich|favorite|favourite|tym|tha tim|thich)/.test(normalized)) {
    intent = 'add_to_favourites';
    reply = 'Mình sẽ thêm sản phẩm vào danh sách yêu thích của bạn.';
  } else if (/(them.*gio|cho.*gio|mua|add to cart|gio hang)/.test(normalized)) {
    intent = 'add_to_cart';
    reply = 'Mình sẽ kiểm tra và thêm sản phẩm vào giỏ hàng cho bạn.';
  } else if (
    /(tim|tim kiem|loc|san pham|laptop|dien thoai|tai nghe|dong ho|gia|ban chay|xem|mau|co .* khong|airpods|ipad|macbook)/.test(
      normalized
    ) ||
    extracted.category
  ) {
    intent = 'search_products';
    reply = 'Dưới đây là các sản phẩm phù hợp tại cửa hàng cho bạn:';
  } else if (
    /(chinh sach|doi tra|giao hang|bao hanh|van chuyen|hoan tien)/.test(normalized)
  ) {
    intent = 'policy_question';
    reply = 'Mình sẽ hỗ trợ giải đáp chính sách cửa hàng cho bạn.';
  } else {
    intent = 'general';
    reply = 'Xin lỗi bạn, mình chưa thể xử lý yêu cầu này hoặc thông tin chưa rõ ràng. Bạn có thể miêu tả chi tiết hơn hoặc hỏi mình về sản phẩm, giỏ hàng nhé!';
  }

  // Detect matching product in favourites or catalog
  let matchedProductId: string | undefined;
  let matchedProductName: string | undefined;

  if (intent === 'remove_from_favourites') {
    const favs = runtime.favourites.getProducts();
    const found = favs.find((f) => normalized.includes(normalizeVietnamese(f.name)));
    if (found) {
      matchedProductId = found.id;
      matchedProductName = found.name;
    } else if (favs.length === 1) {
      matchedProductId = favs[0].id;
      matchedProductName = favs[0].name;
    }
  }

  return {
    reply,
    intent,
    productId: matchedProductId,
    productName: matchedProductName,
    productQuery:
      intent === 'search_products'
        ? {
            query: extracted.query,
            category: extracted.category,
            limit: 5,
          }
        : undefined,
    quantity: 1,
  };
}

async function requestIntent(
  message: string,
  history: ChatMessageHistory[],
  runtime: ChatBotRuntime
): Promise<ChatIntent> {
  const apiKey = DEEPSEEK_API_KEY;

  if (apiKey) {
    try {
      const systemPrompt = await buildSystemPrompt(runtime);
      const messages: DeepSeekMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(
          (item): DeepSeekMessage => ({
            role: item.role,
            content: item.content,
          })
        ),
        { role: 'user', content: message },
      ];

      return await callDeepSeek(apiKey, messages);
    } catch (error) {
      console.warn('Call DeepSeek API failed, fallback to local logic:', error);
    }
  }

  return fallbackIntent(message, runtime);
}

function isRestrictedIntent(intent: ChatIntentName): boolean {
  return (
    intent === 'add_to_cart' ||
    intent === 'remove_from_cart' ||
    intent === 'add_to_favourites' ||
    intent === 'remove_from_favourites' ||
    intent === 'place_order'
  );
}

function guestResponse(intent: ChatIntentName): ChatBotResponse {
  return {
    intent,
    reply:
      'Bạn đang duyệt với tư cách Khách nên chưa thể thực hiện thao tác này. Vui lòng đăng nhập để lưu vào giỏ hàng, danh sách yêu thích hoặc đặt hàng nhé!',
    quickActions: [{ type: 'login', label: 'Đăng nhập ngay' }],
  };
}

async function resolveProduct(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatProduct | null> {
  if (intent.productId) {
    const byId = await runtime.catalog.getProductById(intent.productId);
    if (byId) return byId;
  }

  // Check in favourites first if removing or manipulating favourites
  if (intent.intent === 'remove_from_favourites') {
    const favs = runtime.favourites.getProducts();
    if (intent.productName) {
      const norm = normalizeVietnamese(intent.productName);
      const found = favs.find((f) => normalizeVietnamese(f.name).includes(norm) || norm.includes(normalizeVietnamese(f.name)));
      if (found) return found;
    }
    if (favs.length === 1) return favs[0];
  }

  const query = intent.productQuery?.query ?? intent.productName;

  if (query) {
    const products = await runtime.catalog.searchProducts({
      limit: 5,
      ...intent.productQuery,
      query,
    });
    if (products.length > 0) return products[0];
  }

  if (intent.productQuery) {
    const products = await runtime.catalog.searchProducts({
      ...intent.productQuery,
      limit: intent.productQuery.limit ?? 5,
    });
    if (products.length > 0) return products[0];
  }

  return null;
}

async function handleSearchProducts(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  // If DeepSeek returned specific product IDs that matched
  if (intent.productIds && intent.productIds.length > 0) {
    const all = await runtime.catalog.getAllProducts();
    let matched = all.filter((p) => intent.productIds!.includes(p.id));
    if (intent.productQuery?.maxPrice != null) {
      matched = matched.filter((p) => p.price <= intent.productQuery!.maxPrice!);
    }
    if (intent.productQuery?.minPrice != null) {
      matched = matched.filter((p) => p.price >= intent.productQuery!.minPrice!);
    }
    if (matched.length > 0) {
      return {
        intent: 'search_products',
        reply: intent.reply,
        products: matched,
      };
    }
  }

  const params = intent.productQuery ?? {
    query: intent.productName,
    limit: 5,
  };
  let products = await runtime.catalog.searchProducts(params);

  if (products.length === 0) {
    if (params.category) {
      const byCat = await runtime.catalog.searchProducts({
        category: params.category,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        limit: params.limit ?? 5,
      });
      if (byCat.length > 0) {
        products = byCat;
      }
    } else if (params.query) {
      const byQuery = await runtime.catalog.searchProducts({
        query: params.query,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        limit: params.limit ?? 5,
      });
      if (byQuery.length > 0) {
        products = byQuery;
      }
    }
  }

  if (products.length === 0) {
    const isAffirmativeReply =
      intent.reply &&
      /(tìm được|đây là|gửi bạn|phù hợp|dưới đây)/i.test(intent.reply);
    return {
      intent: 'search_products',
      reply: isAffirmativeReply
        ? 'Rất tiếc hiện tại cửa hàng chưa có sản phẩm nào khớp hoàn toàn với tiêu chí này của bạn. Bạn thử điều chỉnh khoảng giá hoặc xem thêm các sản phẩm khác nhé!'
        : (intent.reply ||
          'Hiện tại cửa hàng chưa có sản phẩm nào phù hợp với yêu cầu của bạn. Bạn thử mô tả hoặc tìm danh mục khác nhé!'),
      quickActions: getInitialQuickActions(runtime),
    };
  }

  return {
    intent: 'search_products',
    reply:
      intent.reply || `Mình tìm thấy ${products.length} sản phẩm phù hợp. Bạn tham khảo nhé!`,
    products,
  };
}

async function handleAddToCart(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  const product = await resolveProduct(intent, runtime);

  if (!product) {
    return {
      intent: 'add_to_cart',
      reply:
        intent.reply ||
        'Bạn muốn thêm sản phẩm nào vào giỏ hàng? Vui lòng cho mình biết tên sản phẩm nhé.',
      quickActions: [
        {
          type: 'suggestion',
          label: 'Tìm sản phẩm',
          value: 'Tìm sản phẩm bán chạy',
        },
      ],
    };
  }

  const quantity = Math.max(1, intent.quantity ?? 1);
  await runtime.cart.addProduct(product, quantity);

  return {
    intent: 'add_to_cart',
    reply: intent.reply || `Đã thêm ${quantity} × ${product.name} vào giỏ hàng thành công!`,
    products: [product],
  };
}

async function handleAddToFavourites(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  const product = await resolveProduct(intent, runtime);

  if (!product) {
    return {
      intent: 'add_to_favourites',
      reply:
        intent.reply ||
        'Bạn muốn lưu sản phẩm nào vào yêu thích? Cho mình biết tên sản phẩm nhé.',
      quickActions: [
        {
          type: 'suggestion',
          label: 'Tìm sản phẩm',
          value: 'Tìm sản phẩm bán chạy',
        },
      ],
    };
  }

  await runtime.favourites.addProduct(product);

  return {
    intent: 'add_to_favourites',
    reply: intent.reply || `Đã thêm "${product.name}" vào danh sách yêu thích của bạn.`,
    products: [product],
  };
}

async function handleRemoveFromFavourites(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  const favs = runtime.favourites.getProducts();

  if (favs.length === 0) {
    return {
      intent: 'remove_from_favourites',
      reply: 'Danh sách yêu thích của bạn hiện đang trống.',
    };
  }

  const product = await resolveProduct(intent, runtime);

  if (!product) {
    return {
      intent: 'remove_from_favourites',
      reply:
        intent.reply ||
        `Bạn đang có ${favs.length} sản phẩm yêu thích: ${favs
          .map((p) => p.name)
          .join(', ')}. Bạn muốn xóa sản phẩm nào?`,
      quickActions: favs.slice(0, 4).map((p) => ({
        type: 'remove_from_favourites',
        label: `Xóa ${p.name.slice(0, 20)}...`,
        productId: p.id,
      })),
    };
  }

  await runtime.favourites.removeProduct(product);

  return {
    intent: 'remove_from_favourites',
    reply: intent.reply || `Đã xóa "${product.name}" khỏi danh sách yêu thích của bạn.`,
    products: [product],
  };
}

async function handlePlaceOrder(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  const items: ChatOrderItem[] = [];
  const directProduct = await resolveProduct(intent, runtime);

  if (directProduct) {
    items.push({
      productId: directProduct.id,
      quantity: Math.max(1, intent.quantity ?? 1),
      product: directProduct,
      unitPrice: directProduct.price,
    });
  }

  if (items.length === 0) {
    for (const cartItem of runtime.cart.getItems()) {
      items.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: cartItem.product,
        unitPrice: cartItem.product?.price,
      });
    }
  }

  if (items.length === 0) {
    return {
      intent: 'place_order',
      reply:
        'Giỏ hàng của bạn đang trống nên chưa thể tạo đơn hàng. Bạn có muốn xem thêm các sản phẩm đang bán chạy không?',
      quickActions: [
        {
          type: 'suggestion',
          label: 'Xem sản phẩm',
          value: 'Xem sản phẩm nổi bật',
        },
      ],
    };
  }

  if (runtime.user.addresses.length === 0) {
    return {
      intent: 'place_order',
      reply:
        'Bạn chưa có địa chỉ nhận hàng trong tài khoản. Vui lòng thêm địa chỉ nhận hàng để mình chuẩn bị đơn nhé!',
      quickActions: [
        { type: 'add_address', label: 'Thêm địa chỉ nhận hàng' },
      ],
    };
  }

  const shippingAddress =
    runtime.user.addresses.find((address) => address.isDefault) ??
    runtime.user.addresses[0];

  if (!shippingAddress) {
    return {
      intent: 'place_order',
      reply:
        'Bạn chưa có địa chỉ nhận hàng. Vui lòng cập nhật địa chỉ để tiếp tục đặt hàng.',
      quickActions: [
        { type: 'add_address', label: 'Thêm địa chỉ nhận hàng' },
      ],
    };
  }

  const totalAmount = items.reduce(
    (sum, item) =>
      sum + (item.unitPrice ?? item.product?.price ?? 0) * item.quantity,
    0
  );

  const orderDraft: ChatOrderDraft = {
    items,
    note: intent.note,
    shippingAddress,
    shippingAddressId: shippingAddress.id,
    totalAmount,
  };

  return {
    intent: 'place_order',
    reply:
      intent.reply ||
      `Mình đã chuẩn bị đơn hàng gồm ${items.length} sản phẩm, tổng cộng ${formatCurrencyVND(
        totalAmount
      )}. Bạn kiểm tra và xác nhận đặt hàng bên dưới nhé:`,
    orderDraft,
    quickActions: [
      {
        type: 'confirm_order',
        label: 'Xác nhận đặt hàng',
        orderDraft,
      },
    ],
  };
}

async function handleIntent(
  intent: ChatIntent,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  if (runtime.user.isGuest && isRestrictedIntent(intent.intent)) {
    return guestResponse(intent.intent);
  }

  switch (intent.intent) {
    case 'search_products':
      return handleSearchProducts(intent, runtime);
    case 'add_to_cart':
      return handleAddToCart(intent, runtime);
    case 'add_to_favourites':
      return handleAddToFavourites(intent, runtime);
    case 'remove_from_favourites':
      return handleRemoveFromFavourites(intent, runtime);
    case 'place_order':
      return handlePlaceOrder(intent, runtime);
    case 'logout':
      return {
        intent: 'logout',
        reply: intent.reply || (runtime.user.isGuest
          ? 'Bạn hiện đang duyệt ở chế độ khách vãng lai (chưa đăng nhập) nên không cần đăng xuất nhé!'
          : 'Mình đã đăng xuất tài khoản thành công cho bạn rồi nhé. Hẹn gặp lại bạn sớm!'),
      };
    case 'policy_question':
    case 'greeting':
    case 'general':
    case 'unknown':
    default:
      return {
        intent: intent.intent,
        reply: intent.reply,
        quickActions: getInitialQuickActions(runtime),
      };
  }
}

export async function processChatMessage({
  message,
  history,
  runtime,
}: ProcessChatMessageParams): Promise<ChatBotResponse> {
  const intent = await requestIntent(message, history, runtime);
  return handleIntent(intent, runtime);
}

export async function executeChatAction(
  action: ChatQuickAction,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  switch (action.type) {
    case 'add_to_cart': {
      if (runtime.user.isGuest) return guestResponse('add_to_cart');

      const product = await runtime.catalog.getProductById(action.productId);
      if (!product) {
        return {
          intent: 'add_to_cart',
          reply: 'Không tìm thấy sản phẩm để thêm vào giỏ hàng.',
        };
      }

      const quantity = Math.max(1, action.quantity ?? 1);
      await runtime.cart.addProduct(product, quantity);

      return {
        intent: 'add_to_cart',
        reply: `Đã thêm ${quantity} × ${product.name} vào giỏ hàng thành công!`,
        products: [product],
      };
    }

    case 'add_to_favourites': {
      if (runtime.user.isGuest) return guestResponse('add_to_favourites');

      const product = await runtime.catalog.getProductById(action.productId);
      if (!product) {
        return {
          intent: 'add_to_favourites',
          reply: 'Không tìm thấy sản phẩm để lưu vào yêu thích.',
        };
      }

      await runtime.favourites.addProduct(product);

      return {
        intent: 'add_to_favourites',
        reply: `Đã thêm "${product.name}" vào danh sách yêu thích của bạn.`,
        products: [product],
      };
    }

    case 'remove_from_favourites': {
      if (runtime.user.isGuest) return guestResponse('remove_from_favourites');

      const product = await runtime.catalog.getProductById(action.productId);
      if (!product) {
        return {
          intent: 'remove_from_favourites',
          reply: 'Không tìm thấy sản phẩm trong danh sách yêu thích.',
        };
      }

      await runtime.favourites.removeProduct(product);

      return {
        intent: 'remove_from_favourites',
        reply: `Đã xóa "${product.name}" khỏi danh sách yêu thích.`,
        products: [product],
      };
    }

    case 'confirm_order':
      return createOrderFromDraft(action.orderDraft, runtime);

    case 'login':
      return {
        intent: 'general',
        reply: 'Vui lòng đăng nhập để tiếp tục trải nghiệm đầy đủ.',
      };

    case 'add_address':
      return {
        intent: 'general',
        reply: 'Vui lòng thêm địa chỉ nhận hàng trong phần Cài đặt tài khoản để tiếp tục đặt hàng.',
      };

    case 'suggestion':
      return {
        intent: 'general',
        reply: 'Mình đã ghi nhận yêu cầu của bạn.',
      };

    default:
      return {
        intent: 'unknown',
        reply: 'Mình chưa hỗ trợ thao tác này.',
      };
  }
}

export async function createOrderFromDraft(
  draft: ChatOrderDraft,
  runtime: ChatBotRuntime
): Promise<ChatBotResponse> {
  if (runtime.user.isGuest) {
    return guestResponse('place_order');
  }

  if (draft.items.length === 0) {
    return {
      intent: 'place_order',
      reply: 'Đơn hàng chưa có sản phẩm nào.',
    };
  }

  const result = await runtime.orders.createOrder(draft);
  const orderCode = result.code ?? result.orderId;

  return {
    intent: 'place_order',
    reply: `🎉 Đặt hàng thành công! Mã đơn của bạn là #${orderCode}. Cửa hàng sẽ chuẩn bị và giao hàng sớm nhất cho bạn nhé!`,
  };
}

export function getInitialQuickActions(
  runtime: ChatBotRuntime
): ChatQuickAction[] {
  if (runtime.user.isGuest) {
    return [
      {
        type: 'suggestion',
        label: '🔍 Tìm sản phẩm',
        value: 'Tìm sản phẩm đang khuyến mãi',
      },
      {
        type: 'suggestion',
        label: '📦 Chính sách giao hàng',
        value: 'Chính sách giao hàng như thế nào?',
      },
      { type: 'login', label: '👤 Đăng nhập ngay' },
    ];
  }

  return [
    {
      type: 'suggestion',
      label: '🔍 Tìm sản phẩm',
      value: 'Gợi ý sản phẩm nổi bật',
    },
    {
      type: 'suggestion',
      label: '🛒 Đặt hàng trong giỏ',
      value: 'Đặt hàng các sản phẩm trong giỏ',
    },
    {
      type: 'suggestion',
      label: '❤️ Xem yêu thích',
      value: 'Tôi có những sản phẩm yêu thích nào?',
    },
  ];
}
