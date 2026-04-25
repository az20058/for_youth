import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { TypeSelector, type CoverLetterType } from './TypeSelector';
import { COLORS } from '../../constants/colors';
import { BASE_URL } from '../../constants/config';

export interface CoverLetterQA {
  id: string;
  question: string;
  answer: string;
  type?: CoverLetterType | null;
}

interface CoverLetterEditorProps {
  applicationId: string;
  initialLetters: CoverLetterQA[];
  onSave: () => void;
  onClose: () => void;
}

let idCounter = Date.now();
function generateId(): string {
  return `cl_${++idCounter}`;
}

export function CoverLetterEditor({
  applicationId,
  initialLetters,
  onSave,
  onClose,
}: CoverLetterEditorProps) {
  const [letters, setLetters] = useState<CoverLetterQA[]>(
    initialLetters.length > 0
      ? initialLetters
      : [{ id: generateId(), question: '', answer: '', type: null }],
  );
  const [saving, setSaving] = useState(false);

  const updateLetter = useCallback((id: string, patch: Partial<CoverLetterQA>) => {
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const deleteLetter = useCallback((id: string) => {
    setLetters((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const addLetter = useCallback(() => {
    setLetters((prev) => [
      ...prev,
      { id: generateId(), question: '', answer: '', type: null },
    ]);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetters: letters }),
      });
      if (!res.ok) {
        throw new Error(`저장 실패 (${res.status})`);
      }
      onSave();
    } catch (err) {
      Alert.alert('오류', err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.headerButton}>닫기</Text>
        </Pressable>
        <Text style={styles.headerTitle}>자기소개서 편집</Text>
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={styles.headerSave}>저장</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {letters.map((letter, index) => (
          <View key={letter.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIndex}>{index + 1}</Text>
              {letters.length > 1 && (
                <Pressable onPress={() => deleteLetter(letter.id)} hitSlop={12}>
                  <Text style={styles.deleteButton}>✕</Text>
                </Pressable>
              )}
            </View>

            <TypeSelector
              value={(letter.type as CoverLetterType) ?? null}
              onChange={(type) => updateLetter(letter.id, { type })}
            />

            <TextInput
              style={styles.questionInput}
              value={letter.question}
              onChangeText={(text) => updateLetter(letter.id, { question: text })}
              placeholder="질문을 입력하세요"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={2}
            />

            <TextInput
              style={styles.answerInput}
              value={letter.answer}
              onChangeText={(text) => updateLetter(letter.id, { answer: text })}
              placeholder="답변을 입력하세요"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>
        ))}

        <Pressable style={styles.addButton} onPress={addLetter}>
          <Text style={styles.addButtonText}>+ 항목 추가</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSave: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  deleteButton: {
    fontSize: 18,
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  questionInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  answerInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
  },
  addButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButtonText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
