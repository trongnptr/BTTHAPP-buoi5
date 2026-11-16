import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';
import Avatar from '../components/Avatar';
import { colors } from '../theme';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const name = user?.displayName || 'Người dùng';

  const onLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            // Xóa user trong AuthContext, RootNavigator tự quay về màn hình Đăng nhập
            await logout();
          } catch (e) {
            setLoggingOut(false);
            Alert.alert('Lỗi', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Avatar name={name} size={64} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} disabled={loggingOut}>
        <Text style={styles.logoutText}>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  name: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 12 },
  email: { fontSize: 14, color: colors.muted, marginTop: 4 },
  logoutBtn: {
    backgroundColor: colors.danger,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
