import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { useAsync } from '../src/hooks/useAsync';
import { SupportService } from '../src/services/support.service';
import { EmptyState } from '../src/components/EmptyState';
import { FormField } from '../src/components/FormField';
import { Toast } from '../src/components/Toast';
import type { Faq } from '../src/types';

// Kích hoạt LayoutAnimation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid ?? 'guest';

  // Lấy danh sách FAQ từ SupportService
  const {
    data: faqs,
    loading: faqsLoading,
    error: faqsError,
    run: loadFaqs,
  } = useAsync<Faq[]>(() => SupportService.getFaqs(), []);

  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal gửi yêu cầu hỗ trợ
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Danh sách FAQ lọc theo từ khoá
  const filteredFaqs = useMemo(() => {
    const source = faqs ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q),
    );
  }, [faqs, query]);

  // Mở rộng câu hỏi đầu tiên khi lần đầu tải xong
  useEffect(() => {
    if (faqs && faqs.length > 0 && expandedId === null) {
      setExpandedId(faqs[0].id);
    }
  }, [faqs, expandedId]);

  const toggleFaq = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleChat = useCallback(() => {
    Alert.alert(
      'Hỗ trợ trực tuyến',
      'Đội ngũ chăm sóc khách hàng đang kết nối với bạn. Vui lòng chờ trong giây lát...',
      [{ text: 'Đóng', style: 'cancel' }],
    );
  }, []);

  const handleCall = useCallback(() => {
    Linking.openURL('tel:19006868').catch(() => {
      Alert.alert('Không thể thực hiện cuộc gọi', 'Vui lòng gọi 1900 6868 để được hỗ trợ.');
    });
  }, []);

  const handleEmail = useCallback(() => {
    Linking.openURL('mailto:support@ecommercemarket.vn').catch(() => {
      Alert.alert(
        'Không thể mở ứng dụng email',
        'Vui lòng gửi email tới support@ecommercemarket.vn để được hỗ trợ.',
      );
    });
  }, []);

  const openContactModal = useCallback(() => {
    setSubject('');
    setMessage('');
    setSubjectError('');
    setMessageError('');
    setModalVisible(true);
  }, []);

  const closeContactModal = useCallback(() => {
    if (!submitting) {
      setModalVisible(false);
    }
  }, [submitting]);

  const handleSendTicket = useCallback(async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    let valid = true;
    if (!trimmedSubject) {
      setSubjectError('Vui lòng nhập chủ đề.');
      valid = false;
    } else {
      setSubjectError('');
    }

    if (!trimmedMessage) {
      setMessageError('Vui lòng nhập nội dung tin nhắn.');
      valid = false;
    } else {
      setMessageError('');
    }

    if (!valid) return;

    setSubmitting(true);
    try {
      await SupportService.createTicket({
        userId,
        subject: trimmedSubject,
        message: trimmedMessage,
      });
      setModalVisible(false);
      setToastMessage('Đã gửi yêu cầu hỗ trợ thành công!');
      setToastVisible(true);
      // Reset form
      setSubject('');
      setMessage('');
    } catch (error) {
      setSubjectError(error instanceof Error ? error.message : 'Không thể gửi yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  }, [userId, subject, message]);

  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const handleHideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={4}
        >
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </Pressable>
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
          <Ionicons name="search" size={19} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm câu hỏi thường gặp..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Tìm kiếm câu hỏi thường gặp"
          />
          {query.length > 0 && (
            <Pressable
              onPress={handleClearQuery}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm"
              hitSlop={4}
            >
              <Ionicons name="close-circle" size={18} color={colors.grayLight} />
            </Pressable>
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

        <Pressable
          onPress={handleChat}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Hỗ trợ trực tuyến"
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="chatbubbles" size={22} color={colors.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Hỗ trợ trực tuyến</Text>
            <Text style={styles.contactSubtitle}>
              Đội ngũ CSKH · Hoạt động 24/7
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
        </Pressable>

        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Hotline tổng đài"
        >
          <View style={[styles.iconBox, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="call" size={21} color={colors.success} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Hotline tổng đài</Text>
            <Text style={styles.contactSubtitle}>
              1900 6868 · Miễn phí cước gọi
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
        </Pressable>

        <Pressable
          onPress={handleEmail}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Email hỗ trợ"
        >
          <View style={[styles.iconBox, { backgroundColor: colors.infoSoft }]}>
            <Ionicons name="mail" size={21} color={colors.info} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Email hỗ trợ</Text>
            <Text style={styles.contactSubtitle} numberOfLines={1}>
              support@ecommercemarket.vn
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
        </Pressable>

        {/* FAQ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
          <Text style={styles.sectionCount}>{filteredFaqs.length} câu hỏi</Text>
        </View>

        {faqsLoading ? (
          <View style={styles.faqStatusWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.faqStatusText}>Đang tải câu hỏi...</Text>
          </View>
        ) : faqsError ? (
          <View style={styles.faqStatusWrap}>
            <Ionicons name="alert-circle-outline" size={42} color={colors.danger} />
            <Text style={styles.faqErrorText}>
              Không thể tải câu hỏi. Vui lòng thử lại.
            </Text>
            <Pressable
              onPress={loadFaqs}
              style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Thử lại"
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : filteredFaqs.length === 0 ? (
          <EmptyState
            icon="search"
            title="Không tìm thấy câu hỏi phù hợp"
            subtitle={`Không có kết quả cho "${query.trim()}"`}
          />
        ) : (
          filteredFaqs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View
                key={item.id}
                style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
              >
                <Pressable
                  onPress={() => toggleFaq(item.id)}
                  style={({ pressed }) => [styles.faqHeader, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={item.question}
                  accessibilityState={{ expanded: isExpanded }}
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
                    color={isExpanded ? colors.primary : colors.grayLight}
                  />
                </Pressable>
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
        <Pressable
          onPress={openContactModal}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Liên hệ đội ngũ hỗ trợ"
        >
          <Ionicons name="headset" size={20} color={colors.white} />
          <Text style={styles.primaryBtnText}>Liên hệ đội ngũ hỗ trợ</Text>
        </Pressable>
        <Text style={styles.footerNote}>
          Thời gian phản hồi trung bình: dưới 5 phút
        </Text>
      </View>

      {/* Modal gửi yêu cầu hỗ trợ */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeContactModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeContactModal}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Gửi yêu cầu hỗ trợ</Text>
            <Text style={styles.modalSubtitle}>
              Vui lòng mô tả ngắn gọn vấn đề của bạn.
            </Text>

            <FormField
              label="Chủ đề"
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                if (subjectError) setSubjectError('');
              }}
              placeholder="Nhập chủ đề yêu cầu"
              icon="document-text-outline"
              error={subjectError}
            />
            <FormField
              label="Nội dung"
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (messageError) setMessageError('');
              }}
              placeholder="Nhập nội dung tin nhắn"
              icon="chatbox-ellipses-outline"
              error={messageError}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeContactModal}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  pressed && styles.pressed,
                  submitting && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Huỷ"
                accessibilityState={{ disabled: submitting }}
              >
                <Text style={styles.cancelButtonText}>Huỷ</Text>
              </Pressable>

              <Pressable
                onPress={handleSendTicket}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.sendButton,
                  pressed && styles.pressed,
                  submitting && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Gửi yêu cầu"
                accessibilityState={{ disabled: submitting, busy: submitting }}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.sendButtonText}>Gửi yêu cầu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Toast thông báo thành công */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={handleHideToast}
      />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: spacing.md,
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
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    color: colors.textSecondary,
  },
  faqStatusWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  faqStatusText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  faqErrorText: {
    marginTop: spacing.sm,
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqItemExpanded: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
    paddingHorizontal: spacing.md,
    paddingBottom: 15,
  },
  faqAnswer: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  tipText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    marginLeft: spacing.sm,
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.white,
  },
  footerNote: {
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'center',
    fontSize: 11.5,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  disabled: {
    opacity: 0.55,
  },
});
