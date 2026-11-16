import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { avatarColor, initialOf } from '../utils/format';
import { colors } from '../theme';

interface Props {
  name: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ name, size = 48, online }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{initialOf(name)}</Text>
      {online !== undefined && (
        <View
          style={[
            styles.dot,
            { backgroundColor: online ? colors.online : colors.offline },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
  letter: { color: '#fff', fontWeight: 'bold' },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
