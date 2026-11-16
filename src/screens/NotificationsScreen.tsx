import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { subscribeUserChats } from '../services/chat';
import { ChatSummary, RootNav } from '../types';
import Avatar from '../components/Avatar';
import { formatListTime } from '../utils/format';
import { colors } from '../theme';

/**
 * Thông báo = các cuộc trò chuyện còn tin chưa đọc.
 * Dữ liệu lấy từ userChats nên cập nhật realtime.
 */
export default function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<RootNav>();
  const [items, setItems] = useState<ChatSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserChats(user.uid, (list) =>
      setItems(list.filter((c) => c.unread > 0)),
    );
    return () => unsub();
  }, [user]);

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.chatId}
      contentContainerStyle={items.length === 0 ? styles.emptyWrap : undefined}
      ListEmptyComponent={<Text style={styles.empty}>Không có thông báo mới</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate('Chat', { chatId: item.chatId, peerId: item.peerId, peerName: item.peerName })}
        >
          <Avatar name={item.peerName} size={44} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              Tin nhắn mới từ {item.peerName}
            </Text>
            <Text style={styles.preview} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.time}>{formatListTime(item.lastTime)}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.muted, padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  preview: { fontSize: 13, color: colors.muted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  time: { fontSize: 12, color: colors.muted },
  badge: {
    marginTop: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
