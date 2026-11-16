import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { subscribeUserChats } from '../services/chat';
import { ChatSummary, RootNav } from '../types';
import Avatar from '../components/Avatar';
import { formatListTime } from '../utils/format';
import { colors } from '../theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<RootNav>();
  const [chats, setChats] = useState<ChatSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserChats(user.uid, setChats);
    return () => unsub();
  }, [user]);

  const openChat = (c: ChatSummary) =>
    navigation.navigate('Chat', { chatId: c.chatId, peerId: c.peerId, peerName: c.peerName });

  return (
    <FlatList
      style={styles.container}
      data={chats}
      keyExtractor={(item) => item.chatId}
      contentContainerStyle={chats.length === 0 ? styles.emptyWrap : undefined}
      ListEmptyComponent={
        <Text style={styles.empty}>Chưa có cuộc trò chuyện nào. Vào Danh bạ để bắt đầu.</Text>
      }
      renderItem={({ item }) => {
        const hasUnread = item.unread > 0;
        return (
          <Pressable style={styles.row} onPress={() => openChat(item)}>
            <Avatar name={item.peerName} size={48} />
            <View style={styles.info}>
              <View style={styles.topLine}>
                <Text style={[styles.name, hasUnread && styles.bold]} numberOfLines={1}>
                  {item.peerName}
                </Text>
                <Text style={styles.time}>{formatListTime(item.lastTime)}</Text>
              </View>
              <View style={styles.bottomLine}>
                <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {hasUnread && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        );
      }}
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
  info: { flex: 1, marginLeft: 12 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  name: { fontSize: 16, color: colors.text, flex: 1, marginRight: 8 },
  bold: { fontWeight: 'bold' },
  time: { fontSize: 12, color: colors.muted },
  preview: { fontSize: 14, color: colors.muted, flex: 1, marginRight: 8 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  badge: {
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
