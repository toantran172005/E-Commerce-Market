import React, { useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    id: '1',
    question: 'Thời gian giao hàng mất bao lâu?',
    answer:
      'Giao hàng tiêu chuẩn: 2 - 4 ngày làm việc. Giao hàng hỏa tốc: 1 - 2 ngày làm việc (áp dụng tại TP.HCM và Hà Nội). Với các khu vực huyện đảo, vùng sâu vùng xa, thời gian giao hàng có thể kéo dài thêm 1 - 2 ngày. Bạn sẽ nhận được thông báo ngay khi đơn hàng được bàn giao cho đơn vị vận chuyển.',
  },
  {
    id: '2',
    question: 'Chính sách đổi trả hàng như thế nào?',
    answer:
      'Hỗ trợ đổi trả miễn phí trong vòng 30 ngày kể từ khi nhận hàng đối với sản phẩm còn nguyên tem mác, chưa qua sử dụng và đầy đủ phụ kiện đi kèm. Một số mặt hàng đặc thù như đồ lót, mỹ phẩm đã bóc tem không được áp dụng đổi trả. Chi phí vận chuyển đổi trả sẽ do chúng tôi chi trả nếu lỗi phát sinh từ phía nhà bán hàng.',
  },
  {
    id: '3',
    question: 'Làm thế nào để theo dõi đơn hàng của tôi?',
    answer:
      'Vào mục "Tài khoản" > "Đơn hàng của tôi", chọn đơn hàng bạn muốn theo dõi để xem trạng thái mới nhất. Bạn cũng có thể nhấn vào thông báo đẩy hoặc tra cứu bằng mã vận đơn tại mục "Tra cứu đơn hàng" ngay trên trang chủ.',
  },
  {
    id: '4',
    question: 'Những phương thức thanh toán nào được chấp nhận?',
    answer:
      'Chúng tôi hỗ trợ thanh toán bằng thẻ Visa/Mastercard/JCB, ví điện tử MoMo, ZaloPay, chuyển khoản ngân hàng và thanh toán khi nhận hàng (COD). Mọi giao dịch đều được mã hóa và bảo mật theo tiêu chuẩn quốc tế, đảm bảo an toàn tuyệt đối cho khách hàng.',
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(FAQS[0].id);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q),
    );
  }, [query]);

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleChat = () => {
    Alert.alert(
      'Hỗ trợ trực tuyến',
      'Đội ngũ chăm sóc khách hàng đang kết nối với bạn. Vui lòng chờ trong giây lát...',
      [{ text: 'Đóng', style: 'cancel' }],
    );
  };

  const handleCall = () => {
    Linking.openURL('tel:19006868').catch(() => {
      Alert.alert('Không thể thực hiện cuộc gọi', 'Vui lòng gọi 1900 6868 để được hỗ trợ.');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@ecommercemarket.vn').catch(() => {
      Alert.alert(
        'Không thể mở ứng dụng email',
        'Vui lòng gửi email tới support@ecommercemarket.vn để được hỗ trợ.',
      );
    });
  };

  const handleContactTeam = () => {
    Alert.alert(
      'Liên hệ đội ngũ hỗ trợ',
      'Yêu cầu của bạn đã được ghi nhận. Đội ngũ hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất!',
      [{ text: 'Đóng', style: 'cancel' }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thanh tìm kiếm */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={19} color="#9AA0A6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm câu hỏi thường gặp..."
            placeholderTextColor="#9AA0A6"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={18} color="#C4C9D0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Kênh hỗ trợ nhanh */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kênh hỗ trợ nhanh</Text>
          <View style={styles.sectionBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.sectionBadgeText}>Trực tuyến</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={handleChat}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FFEDE6' }]}>
            <Ionicons name="chatbubbles" size={22} color={colors.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Hỗ trợ trực tuyến</Text>
            <Text style={styles.contactSubtitle}>
              Đội ngũ CSKH · Hoạt động 24/7
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C4C9D0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={handleCall}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E6F6EF' }]}>
            <Ionicons name="call" size={21} color="#1E9E6A" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Hotline tổng đài</Text>
            <Text style={styles.contactSubtitle}>
              1900 6868 · Miễn phí cước gọi
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C4C9D0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={handleEmail}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E8F1FE' }]}>
            <Ionicons name="mail" size={21} color="#3B82F6" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email hỗ trợ</Text>
            <Text style={styles.contactSubtitle} numberOfLines={1}>
              support@ecommercemarket.vn
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C4C9D0" />
        </TouchableOpacity>

        {/* FAQ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          <Text style={styles.sectionCount}>{filteredFaqs.length} câu hỏi</Text>
        </View>

        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={38} color="#C4C9D0" />
            <Text style={styles.emptyText}>
              Không tìm thấy câu hỏi phù hợp với "{query.trim()}"
            </Text>
          </View>
        ) : (
          filteredFaqs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.faqItem,
                  isExpanded && styles.faqItemExpanded,
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.8}
                  onPress={() => toggleFaq(item.id)}
                >
                  <Text
                    style={[
                      styles.faqQuestion,
                      isExpanded && styles.faqQuestionActive,
                    ]}
                  >
                    {item.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={isExpanded ? colors.primary : '#9AA0A6'}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswerWrap}>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={styles.tipText}>
            Không tìm thấy câu trả lời bạn cần? Hãy liên hệ đội ngũ hỗ trợ, chúng
            tôi luôn sẵn sàng 24/7.
          </Text>
        </View>
      </ScrollView>

      {/* Nút liên hệ */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={handleContactTeam}
        >
          <Ionicons name="headset" size={20} color={colors.white} />
          <Text style={styles.primaryBtnText}>Liên hệ đội ngũ hỗ trợ</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Thời gian phản hồi trung bình: dưới 5 phút
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.dark,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.dark,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#E6F6EF',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E9E6A',
    marginRight: 5,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E9E6A',
  },
  sectionCount: {
    fontSize: 12,
    color: '#9AA0A6',
    fontWeight: '500',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  contactSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    color: '#6B7280',
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqItemExpanded: {
    borderColor: colors.primary,
    backgroundColor: '#FFFBF9',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  faqQuestion: {
    flex: 1,
    paddingRight: 10,
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.dark,
  },
  faqQuestionActive: {
    color: colors.primary,
  },
  faqAnswerWrap: {
    paddingHorizontal: 14,
    paddingBottom: 15,
  },
  faqAnswer: {
    fontSize: 13.5,
    lineHeight: 21,
    color: '#6B7280',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13.5,
    color: '#9AA0A6',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFEDE6',
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#B8431A',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    marginLeft: 8,
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.white,
  },
  footerNote: {
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontSize: 11.5,
    color: '#9AA0A6',
  },
});