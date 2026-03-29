import React from 'react';
import {
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 72,
  xl: 96,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: typography.fontSize.xs,
  md: typography.fontSize.base,
  lg: typography.fontSize.xl,
  xl: typography.fontSize['3xl'],
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  onPress,
}) => {
  const dimension = sizeMap[size];
  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };
  const imageStyle: ImageStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  const content = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, imageStyle]}
    />
  ) : (
    <View style={[styles.fallback, containerStyle]}>
      <Text
        style={[
          styles.initials,
          { fontSize: fontSizeMap[size] },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.brand.white,
    fontWeight: typography.fontWeight.bold,
  },
});

export default Avatar;
