import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { subscribeUsers } from '../services/users';
import { getChatId } from '../services/chat';
import { UserProfile, RootNav } from '../types';
import Avatar from '../components/Avatar';
import { colors } from '../theme';

export default function ContactsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<RootNav>();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [keyword, setKeyword] = useState('');

  // Realtime: trạng thái online cập nhật ngay khi người khác đổi
  useEffect(() => {
    const unsub = subscribeUsers(setUsers);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return users
      .filter((u) => u.uid !== user?.uid)            // bỏ chính mình
      .filter((u) => u.name.trim() !== '')          // bỏ hồ sơ chưa đầy đủ
      .filter((u) => k === '' || u.name.toLowerCase().includes(k) || u.email.toLowerCase().includes(k))
      .sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, 'vi'));
  }, [users, keyword, user?.uid]);

  const openChat = (peer: UserProfile) => {
    if (!user) return;
    navigation.navigate('Chat', {
      chatId: getChatId(user.uid, peer.uid),
      peerId: peer.uid,
      peerName: peer.name,
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Tìm theo tên hoặc email"
        value={keyword}
        onChangeText={setKeyword}
        autoCapitalize="none"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy người dùng</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openChat(item)}>
            <Avatar name={item.name} size={44} online={item.online} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.status, item.online && styles.online]}>
                {item.online ? 'Đang online' : 'Offline'}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  search: {
    margin: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
    fontSize: 15,
  },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  info: { marginLeft: 12 },
  name: { fontSize: 16, color: colors.text, fontWeight: '600' },
  status: { fontSize: 13, color: colors.offline, marginTop: 2 },
  online: { color: colors.online },
});
