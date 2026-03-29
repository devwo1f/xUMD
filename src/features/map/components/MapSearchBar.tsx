/**
 * MapSearchBar
 *
 * Floating search bar for the map screen.
 * Debounced input with dropdown results for buildings and events.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing, borderRadius, shadows } from '../../../shared/theme/spacing';
import { buildings, type Building } from '../../../assets/data/buildings';
import type { Event } from '../../../shared/types';

interface MapSearchBarProps {
  events: Event[];
  onSelectBuilding: (building: Building) => void;
  onSelectEvent: (event: Event) => void;
}

type SearchResult =
  | { type: 'building'; item: Building }
  | { type: 'event'; item: Event };

const MapSearchBar: React.FC<MapSearchBarProps> = ({
  events,
  onSelectBuilding,
  onSelectEvent,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const results: SearchResult[] = React.useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    if (needle.length < 2) return [];

    const matchedBuildings: SearchResult[] = buildings
      .filter(
        (b) =>
          b.name.toLowerCase().includes(needle) ||
          b.code.toLowerCase().includes(needle),
      )
      .slice(0, 4)
      .map((b) => ({ type: 'building', item: b }));

    const matchedEvents: SearchResult[] = events
      .filter(
        (e) =>
          e.title.toLowerCase().includes(needle) ||
          e.location_name.toLowerCase().includes(needle),
      )
      .slice(0, 4)
      .map((e) => ({ type: 'event', item: e }));

    return [...matchedEvents, ...matchedBuildings];
  }, [debouncedQuery, events]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'building') {
        onSelectBuilding(result.item as Building);
      } else {
        onSelectEvent(result.item as Event);
      }
      setQuery('');
      setIsFocused(false);
    },
    [onSelectBuilding, onSelectEvent],
  );

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  const showDropdown = isFocused && results.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={18} color={colors.text.tertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay blur so onPress on dropdown fires first
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder="Search buildings, events..."
          placeholderTextColor={colors.text.tertiary}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
          </Pressable>
        )}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item, index) =>
              `${item.type}-${item.type === 'building' ? (item.item as Building).id : (item.item as Event).id}-${index}`
            }
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: result }) => {
              const isBuilding = result.type === 'building';
              const building = isBuilding ? (result.item as Building) : null;
              const event = !isBuilding ? (result.item as Event) : null;

              return (
                <Pressable
                  style={styles.resultItem}
                  onPress={() => handleSelect(result)}
                >
                  <Ionicons
                    name={isBuilding ? 'business-outline' : 'calendar-outline'}
                    size={18}
                    color={isBuilding ? colors.gray[600] : colors.primary.main}
                  />
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {isBuilding ? building!.name : event!.title}
                    </Text>
                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {isBuilding
                        ? `${building!.building_type} \u00b7 ${building!.code}`
                        : event!.location_name}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    height: 48,
    ...shadows.md,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing.xs,
  },
  dropdown: {
    marginTop: spacing.xs,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.md,
    maxHeight: 280,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.sm,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  resultSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default MapSearchBar;
