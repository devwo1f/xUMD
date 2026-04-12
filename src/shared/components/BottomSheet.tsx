import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  minHeight?: number;
  maxHeight?: number;
}

const DEFAULT_SNAP_POINTS = [0.4, 0.7];

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  minHeight = 280,
  maxHeight,
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = useMemo(() => {
    const requested = snapPoints[0] ?? 0.4;
    const resolvedHeight =
      requested > 1 ? requested : screenHeight * requested;
    const cappedMaxHeight = Math.min(
      maxHeight ?? screenHeight * 0.9,
      screenHeight * 0.94,
    );

    return Math.max(minHeight, Math.min(resolvedHeight, cappedMaxHeight));
  }, [maxHeight, minHeight, screenHeight, snapPoints]);

  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetHeight, translateY, overlayOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > sheetHeight * 0.3 || gestureState.vy > 0.5) {
          // Dismiss
          Animated.timing(translateY, {
            toValue: sheetHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.wrapper}>
        {/* Overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          </View>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});

export default BottomSheet;
