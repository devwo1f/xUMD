/**
 * EventPin
 *
 * Custom marker used by the react-native-maps fallback only.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '../../../shared/theme/colors';
import type { Event, EventCategory } from '../../../shared/types';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  social: colors.eventCategory.social,
  academic: colors.eventCategory.academic,
  career: colors.eventCategory.career,
  sports: colors.eventCategory.sports,
  club: colors.eventCategory.club,
  arts: colors.eventCategory.arts,
  food: colors.eventCategory.food,
  tech: colors.eventCategory.tech,
  talks: colors.eventCategory.talks,
  workshop: colors.eventCategory.workshop,
  party: colors.eventCategory.party,
  other: colors.eventCategory.other,
};

interface EventPinProps {
  event: Event;
  onPress: (event: Event) => void;
  isFeatured?: boolean;
}

const EventPin: React.FC<EventPinProps> = ({ event, onPress, isFeatured = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isFeatured) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.22,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isFeatured, pulseAnim]);

  if (!event.latitude || !event.longitude) return null;

  const color = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other;
  const pinSize = isFeatured ? 32 : 24;
  const dotSize = isFeatured ? 14 : 10;

  return (
    <Marker
      coordinate={{ latitude: event.latitude, longitude: event.longitude }}
      onPress={() => onPress(event)}
      tracksViewChanges={isFeatured}
    >
      <Animated.View
        style={[
          styles.container,
          isFeatured && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View
          style={[
            styles.pin,
            {
              width: pinSize,
              height: pinSize,
              borderRadius: pinSize / 2,
              backgroundColor: color,
            },
          ]}
        >
          <View
            style={[
              styles.innerDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
              },
            ]}
          />
        </View>
        <View style={[styles.pinTail, { borderTopColor: color }]} />
      </Animated.View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  innerDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});

export default EventPin;
