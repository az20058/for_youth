import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export type CoverLetterType =
  | '지원 동기'
  | '성장 과정'
  | '직무 역량'
  | '성격 장단점'
  | '성공 경험'
  | '실패 경험'
  | '팀워크 경험'
  | '입사 후 포부'
  | '기타';

const TYPES: CoverLetterType[] = [
  '지원 동기',
  '성장 과정',
  '직무 역량',
  '성격 장단점',
  '성공 경험',
  '실패 경험',
  '팀워크 경험',
  '입사 후 포부',
  '기타',
];

interface TypeSelectorProps {
  value: CoverLetterType | null;
  onChange: (type: CoverLetterType) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TYPES.map((type) => {
        const selected = type === value;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {type}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
