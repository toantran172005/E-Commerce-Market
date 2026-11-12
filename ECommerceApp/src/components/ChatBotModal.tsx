import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavourites } from '../context/FavouritesContext';
import { useAddresses } from '../context/AddressesContext';
import { useOrders } from '../context/OrdersContext';
import { useNotifications } from '../context/NotificationsContext';
import { CatalogService } from '../services/catalogService';
import { OrderService } from '../services/orderService';
import {
  createChatBotRuntime,
  createOrderFromDraft,
  executeChatAction,
  formatCurrencyVND,
  getInitialQuickActions,
  processChatMessage,
  type ChatAddress,
  type ChatBotResponse,
  type ChatBotRuntime,
  type ChatMessageHistory,
  type ChatOrderDraft,
  type ChatProduct,
  type ChatQuickAction,
} from '../services/chatBotService';

const BRAND = {
  primary: '#FF5722',
  primaryDark: '#D9400F',
  primarySoft: '#FFEDE6',
  primaryWarm: '#FFF7ED',
  primaryBorder: '#FED7AA',
  text: '#1F2937',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
  background: '#FFFFFF',
  bubbleBot: '#F3F4F6',
  danger: '#EF4444',
};

export interface ChatBotModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface ChatUiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: ChatProduct[];
  quickActions?: ChatQuickAction[];
  orderDraft?: ChatOrderDraft;
}

let messageSequence = 0;

function createMessageId(role: 'user' | 'assistant'): string {
  messageSequence += 1;
  return `${role}-${Date.now()}-${messageSequence}`;
}

function formatAddress(address: ChatAddress): string {
  return [
    address.fullName,
    address.phone,
    address.addressLine,
    address.ward,
    address.district,
    address.city,
  ]
    .filter((value): value is string => Boolean(value))
    .join(', ');
}

function createInitialMessage(runtime: ChatBotRuntime): ChatUiMessage {
  const name = runtime.user.displayName ? ` ${runtime.user.displayName}` : '';

  return {
    id: createMessageId('assistant'),
    role: 'assistant',
    text: runtime.user.isGuest
      ? `Xin chào${name}! Mình là Trợ Lý AI. Bạn có thể trò chuyện, nhờ mình tư vấn cấu hình, so sánh hoặc tìm sản phẩm. Để thêm giỏ, lưu yêu thích hoặc đặt hàng, bạn hãy đăng nhập tài khoản nhé!`
      : `Xin chào${name}! Mình là Trợ Lý AI. Mình có thể tư vấn sản phẩm, giải đáp mọi thắc mắc, thêm vào giỏ, quản lý yêu thích hoặc đặt hàng trực tiếp giúp bạn. Bạn cần gì cứ nhắn mình nhé!`,
    quickActions: getInitialQuickActions(runtime),
  };
}

function toUiMessage(response: ChatBotResponse): ChatUiMessage {
  return {
    id: createMessageId('assistant'),
    role: 'assistant',
    text: response.reply,
    products: response.products,
    quickActions: response.quickActions,
    orderDraft: response.orderDraft,
  };
}

export default function ChatBotModal({ visible, onClose }: ChatBotModalProps) {
  const router = useRouter();
  const auth = useAuth();
  const cart = useCart();
  const favourites = useFavourites();
  const addresses = useAddresses();
  const orders = useOrders();
  const notifications = useNotifications();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<ChatUiMessage>>(null);

  const runtime = useMemo<ChatBotRuntime>(
    () =>
      createChatBotRuntime({
        auth,
        cart,
        favourites,
        catalog: CatalogService,
        order: OrderService,
        addresses: addresses.addresses,
        notifications: {
          createNotification: (input: any) => notifications.addNotification(input),
        },
      }),
    [addresses.addresses, auth, cart, favourites, notifications]
  );

  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([createInitialMessage(runtime)]);
    }
  }, [messages.length, runtime, visible]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const history = useMemo<ChatMessageHistory[]>(
    () =>
      messages.map((item) => ({
        role: item.role,
        content: item.text,
      })),
    [messages]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatUiMessage = {
        id: createMessageId('user'),
        role: 'user',
        text: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      scrollToBottom();

      try {
        const response = await processChatMessage({
          message: trimmed,
          history: [...history, { role: 'user', content: trimmed }],
          runtime,
        });

        setMessages((prev) => [...prev, toUiMessage(response)]);

        if (response.intent === 'logout' && !runtime.user.isGuest) {
          setTimeout(async () => {
            try {
              await auth.logout();
              onClose();
            } catch (err) {
              console.warn('Logout via chat failed:', err);
            }
          }, 1200);
        }
      } catch (error) {
        const errorMsg: ChatUiMessage = {
          id: createMessageId('assistant'),
          role: 'assistant',
          text: 'Xin lỗi bạn, mình đang gặp sự cố kết nối. Bạn thử gửi lại câu hỏi nhé!',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [auth, history, isLoading, onClose, runtime, scrollToBottom]
  );

  const handleAction = useCallback(
    async (action: ChatQuickAction) => {
      if (action.type === 'suggestion') {
        await sendMessage(action.value);
        return;
      }

      if (action.type === 'login') {
        onClose();
        router.push('/(auth)/login');
        return;
      }

      if (action.type === 'add_address') {
        onClose();
        router.push('/shipping-address');
        return;
      }

      if (action.type === 'view_orders') {
        onClose();
        router.push('/orders');
        return;
      }

      if (action.type === 'confirm_order') {
        setIsLoading(true);
        try {
          const res = await createOrderFromDraft(action.orderDraft, runtime);
          // Clear cart immediately
          cart.clearCart();
          // Reload orders context so user profile and orders screen update immediately
          try {
            await orders.loadOrders();
          } catch {
            // ignore
          }
          // Reload notifications so notification screen updates with the new order notification
          try {
            await notifications.loadNotifications();
          } catch {
            // ignore
          }
          setMessages((prev) => [...prev, toUiMessage(res)]);
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Đặt hàng không thành công.';
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId('assistant'),
              role: 'assistant',
              text: `Không thể hoàn tất đơn hàng: ${msg}`,
            },
          ]);
        } finally {
          setIsLoading(false);
          scrollToBottom();
        }
        return;
      }

      setIsLoading(true);
      try {
        const res = await executeChatAction(action, runtime);
        setMessages((prev) => [...prev, toUiMessage(res)]);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Thao tác không thành công.';
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId('assistant'),
            role: 'assistant',
            text: msg,
          },
        ]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    },
    [cart, onClose, orders, router, runtime, sendMessage, scrollToBottom]
  );

  const handleProductAddToCart = useCallback(
    async (product: ChatProduct) => {
      await handleAction({
        type: 'add_to_cart',
        label: `Thêm ${product.name}`,
        productId: product.id,
        quantity: 1,
      });
    },
    [handleAction]
  );

  const handleProductToggleFavourite = useCallback(
    async (product: ChatProduct) => {
      const isFav = favourites.isFavourite(product.id);
      if (isFav) {
        await handleAction({
          type: 'remove_from_favourites',
          label: `Bỏ thích ${product.name}`,
          productId: product.id,
        });
      } else {
        await handleAction({
          type: 'add_to_favourites',
          label: `Thích ${product.name}`,
          productId: product.id,
        });
      }
    },
    [favourites, handleAction]
  );

  const renderMessage = ({ item }: ListRenderItemInfo<ChatUiMessage>) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Ionicons name="sparkles" size={14} color={BRAND.white} />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAssistant,
            ]}
          >
            {item.text}
          </Text>

          {item.products && item.products.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productsScroll}
              contentContainerStyle={styles.productsContainer}
            >
              {item.products.map((product) => {
                const isFav = favourites.isFavourite(product.id);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose();
                      router.push(`/product/${product.id}`);
                    }}
                  >
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <Ionicons name="image-outline" size={24} color={BRAND.textMuted} />
                      </View>
                    )}
                    <Text numberOfLines={2} style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text style={styles.productPrice}>
                      {formatCurrencyVND(product.price)}
                    </Text>

                    <View style={styles.productActionsRow}>
                      <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleProductAddToCart(product);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="cart-outline" size={13} color={BRAND.primaryDark} />
                        <Text style={styles.addToCartText}>+ Giỏ</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.favouriteButton}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleProductToggleFavourite(product);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={18}
                          color={BRAND.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {item.orderDraft && (
            <View style={styles.orderDraftCard}>
              <View style={styles.orderDraftHeader}>
                <Ionicons name="receipt-outline" size={18} color={BRAND.primaryDark} />
                <Text style={styles.orderDraftTitle}>Xác nhận đặt hàng</Text>
              </View>

              {item.orderDraft.shippingAddress && (
                <Text style={styles.orderDraftAddress}>
                  Giao đến: {formatAddress(item.orderDraft.shippingAddress)}
                </Text>
              )}

              <View style={styles.orderDraftItems}>
                {item.orderDraft.items.map((orderItem) => (
                  <View key={orderItem.productId} style={styles.orderDraftItemRow}>
                    <Text numberOfLines={1} style={styles.orderDraftItemName}>
                      {orderItem.product?.name ?? orderItem.productId}
                    </Text>
                    <Text style={styles.orderDraftItemQty}>x{orderItem.quantity}</Text>
                    <Text style={styles.orderDraftItemPrice}>
                      {formatCurrencyVND(
                        (orderItem.unitPrice ?? orderItem.product?.price ?? 0) *
                          orderItem.quantity
                      )}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderDraftTotalRow}>
                <Text style={styles.orderDraftTotalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.orderDraftTotalValue}>
                  {formatCurrencyVND(item.orderDraft.totalAmount ?? 0)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.confirmOrderButton}
                onPress={() =>
                  handleAction({
                    type: 'confirm_order',
                    label: 'Xác nhận đặt hàng',
                    orderDraft: item.orderDraft!,
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={styles.confirmOrderButtonText}>Xác nhận đặt hàng</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.quickActions && item.quickActions.length > 0 && (
            <View style={styles.actionsContainer}>
              {item.quickActions.map((action, idx) => (
                <TouchableOpacity
                  key={`${action.type}-${idx}`}
                  style={styles.actionPill}
                  onPress={() => handleAction(action)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionPillText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const userStatusText = runtime.user.isGuest
    ? 'Khách vãng lai · Trực tuyến'
    : `${runtime.user.displayName || runtime.user.email || 'Khách hàng'} · Trực tuyến`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.avatarWrap}>
                <Ionicons name="sparkles" size={18} color={BRAND.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Trợ Lý AI</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {userStatusText}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Đóng khung chat"
            >
              <Ionicons name="close" size={24} color={BRAND.text} />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
          />

          {isLoading && (
            <View style={styles.loadingRow}>
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={14} color={BRAND.white} />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={BRAND.primary} />
                <Text style={styles.loadingText}>Đang suy nghĩ...</Text>
              </View>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Hỏi sản phẩm, thêm giỏ, đặt hàng..."
              placeholderTextColor={BRAND.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              accessibilityLabel="Gửi tin nhắn"
            >
              <Ionicons name="send" size={18} color={BRAND.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    backgroundColor: BRAND.white,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: BRAND.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: BRAND.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: BRAND.bubbleBot,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextUser: {
    color: BRAND.white,
  },
  messageTextAssistant: {
    color: BRAND.text,
  },
  productsScroll: {
    marginTop: 10,
    marginHorizontal: -4,
  },
  productsContainer: {
    paddingVertical: 2,
  },
  productCard: {
    width: 170,
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 9,
    marginRight: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  productImage: {
    width: '100%',
    height: 96,
    borderRadius: 8,
    backgroundColor: BRAND.primarySoft,
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.text,
    marginTop: 6,
    lineHeight: 18,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.primaryDark,
    marginTop: 3,
  },
  productActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.primaryDark,
    marginLeft: 4,
  },
  favouriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDraftCard: {
    marginTop: 10,
    backgroundColor: BRAND.primaryWarm,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  orderDraftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderDraftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.primaryDark,
    marginLeft: 6,
  },
  orderDraftAddress: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginBottom: 8,
    lineHeight: 16,
  },
  orderDraftItems: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BRAND.primaryBorder,
    paddingVertical: 6,
    marginVertical: 4,
  },
  orderDraftItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  orderDraftItemName: {
    flex: 1,
    fontSize: 12,
    color: BRAND.text,
    marginRight: 6,
  },
  orderDraftItemQty: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginRight: 8,
  },
  orderDraftItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.text,
  },
  orderDraftTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  orderDraftTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.text,
  },
  orderDraftTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.primaryDark,
  },
  confirmOrderButton: {
    backgroundColor: BRAND.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  confirmOrderButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  actionPill: {
    backgroundColor: BRAND.primarySoft,
    borderWidth: 1,
    borderColor: BRAND.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.primaryDark,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.bubbleBot,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginLeft: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: BRAND.white,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: BRAND.text,
    marginRight: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#FFCCBC',
  },
});
