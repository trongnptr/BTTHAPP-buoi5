import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { markAsRead, sendMessage, subscribeMessages } from '../services/chat';
import { subscribeUser } from '../services/users';
import { getCurrentLocation, requestLocationPermission } from '../services/location';
import { Message, RootStackParamList } from '../types';
import { formatClock } from '../utils/format';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { chatId, peerId, peerName } = route.params;
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const senderName = user?.displayName || user?.email || 'Người dùng';

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [peerOnline, setPeerOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  // Lắng nghe tin nhắn realtime, hủy khi rời màn hình để không bị lặp
  useEffect(() => {
    if (!uid) return;
    setMessages([]);
    const startedAt = Date.now();

    const unsub = subscribeMessages(chatId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].sort((a, b) => a.createdAt - b.createdAt);
      });
      // Tin mới của đối phương khi đang mở chat thì coi như đã đọc
      if (msg.senderId !== uid && msg.createdAt >= startedAt - 1000) {
        markAsRead(uid, chatId).catch(() => {});
      }
    });

    markAsRead(uid, chatId).catch(() => {});
    return () => unsub();
  }, [chatId, uid]);

  // Theo dõi trạng thái online của đối phương
  useEffect(() => {
    const unsub = subscribeUser(peerId, (p) => setPeerOnline(!!p?.online));
    return () => unsub();
  }, [peerId]);

  // Tiêu đề hiển thị tên và trạng thái online
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.headerName} numberOfLines={1}>{peerName}</Text>
          <Text style={styles.headerStatus}>{peerOnline ? 'Đang online' : 'Offline'}</Text>
        </View>
      ),
    });
  }, [navigation, peerName, peerOnline]);

  const onSendText = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);
    try {
      await sendMessage({ chatId, senderId: uid, senderName, peerId, peerName, text: content });
    } catch (e) {
      setText(content);
      Alert.alert('Gửi thất bại', (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onSendLocation = async () => {
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Thiếu quyền', 'Hãy cấp quyền vị trí để gửi vị trí.');
        return;
      }
      const location = await getCurrentLocation();
      await sendMessage({ chatId, senderId: uid, senderName, peerId, peerName, location });
    } catch (e) {
      Alert.alert('Không lấy được vị trí', (e as Error).message);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId === uid;
    const isLocation = item.type === 'location' && !!item.location;

    return (
      <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {isLocation && item.location ? (
            <Pressable
              onPress={() =>
                Linking.openURL(`https://maps.google.com/?q=${item.location!.latitude},${item.location!.longitude}`)
              }
            >
              <Text style={[styles.text, isMine && styles.textMine]}>📍 Vị trí</Text>
              <Text style={[styles.coords, isMine && styles.textMine]}>
                {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
              </Text>
              <Text style={[styles.mapLink, isMine && styles.textMine]}>Mở bản đồ</Text>
            </Pressable>
          ) : (
            <Text style={[styles.text, isMine && styles.textMine]}>{item.text}</Text>
          )}
          <Text style={[styles.time, isMine && styles.timeMine]}>{formatClock(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        // Tự cuộn xuống tin mới nhất mỗi khi nội dung thay đổi
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.locationBtn} onPress={onSendLocation}>
          <Text style={styles.locationIcon}>📍</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={onSendText}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerName: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  headerStatus: { color: '#d6ebff', fontSize: 12 },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', marginVertical: 4 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  text: { fontSize: 16, color: colors.text },
  textMine: { color: '#fff' },
  coords: { fontSize: 13, color: colors.muted, marginTop: 2 },
  mapLink: { fontSize: 13, color: colors.primary, marginTop: 4, textDecorationLine: 'underline' },
  time: { fontSize: 11, color: colors.muted, alignSelf: 'flex-end', marginTop: 4 },
  timeMine: { color: '#cfe3f7' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  locationBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  locationIcon: { fontSize: 20 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: colors.bg,
  },
  sendBtn: {
    marginLeft: 8,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.offline },
  sendText: { color: '#fff', fontWeight: 'bold' },
});
