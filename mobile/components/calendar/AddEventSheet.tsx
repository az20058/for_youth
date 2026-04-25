import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import type { ScheduleEvent } from '../../hooks/useScheduleApi';

type ManualEventType = Exclude<ScheduleEvent['type'], 'DEADLINE'>;

const TYPE_OPTIONS: { value: ManualEventType; label: string; color: string }[] = [
  { value: 'CODING_TEST', label: '코딩테스트', color: '#3B82F6' },
  { value: 'INTERVIEW', label: '면접', color: '#8B5CF6' },
  { value: 'DOCUMENT', label: '서류', color: '#EF4444' },
  { value: 'OTHER', label: '기타', color: '#6B7280' },
];

interface AddEventSheetProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    date: string;
    type: ScheduleEvent['type'];
    memo?: string;
  }) => void;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function AddEventSheet({
  visible,
  selectedDate,
  onClose,
  onSubmit,
}: AddEventSheetProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ManualEventType>('OTHER');
  const [memo, setMemo] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      date: formatDate(selectedDate),
      type,
      memo: memo.trim() || undefined,
    });
    setTitle('');
    setType('OTHER');
    setMemo('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setType('OTHER');
    setMemo('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>일정 추가</Text>
                <Pressable onPress={handleClose} hitSlop={12}>
                  <X size={22} color={COLORS.textSecondary} />
                </Pressable>
              </View>

              {/* Date display */}
              <View style={styles.field}>
                <Text style={styles.label}>날짜</Text>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>
                    {formatDisplayDate(selectedDate)}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <View style={styles.field}>
                <Text style={styles.label}>제목</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="일정 제목을 입력하세요"
                  placeholderTextColor={COLORS.textSecondary}
                  returnKeyType="done"
                />
              </View>

              {/* Type selector */}
              <View style={styles.field}>
                <Text style={styles.label}>유형</Text>
                <View style={styles.typeRow}>
                  {TYPE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.typeButton,
                        type === opt.value && {
                          borderColor: opt.color,
                          backgroundColor: opt.color + '20',
                        },
                      ]}
                      onPress={() => setType(opt.value)}
                    >
                      <View
                        style={[
                          styles.typeButtonDot,
                          { backgroundColor: opt.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          type === opt.value && { color: opt.color },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Memo */}
              <View style={styles.field}>
                <Text style={styles.label}>메모 (선택)</Text>
                <TextInput
                  style={[styles.textInput, styles.memoInput]}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="메모를 입력하세요"
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit */}
              <Pressable
                style={[
                  styles.submitButton,
                  !title.trim() && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!title.trim()}
              >
                <Text style={styles.submitText}>일정 추가</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  field: {
    marginTop: 16,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateDisplay: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memoInput: {
    minHeight: 80,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeButtonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
