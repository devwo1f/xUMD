import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface CategoryChipsProps {
  categories: string[];
  selected?: string;
  onSelect: (category: string) => void;
  colorMap?: Record<string, string>;
  style?: ViewStyle;
}

const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selected,
  onSelect,
  colorMap,
  style,
}) => {
  const getChipColor = (category: string): string => {
    if (colorMap && colorMap[category.toLowerCase()]) {
      return colorMap[category.toLowerCase()];
    }
    return colors.primary.main;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {categories.map((category) => {
        const isSelected = selected === category;
        const chipColor = getChipColor(category);

        return (
          <TouchableOpacity
            key={category}
            onPress={() => onSelect(category)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: chipColor }
                : { backgroundColor: 'transparent', borderWidth: 1, borderColor: chipColor },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? colors.brand.white : chipColor },
              ]}
              numberOfLines={1}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    marginRight: spacing.sm,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
});

export default CategoryChips;
