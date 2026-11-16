import {
  ref,
  push,
  update,
  onChildAdded,
  onValue,
  query,
  orderByChild,
  limitToLast,
  runTransaction,
  Unsubscribe,
} from 'firebase/database';
import { db } from './firebase';
import { ChatSummary, LatLng, Message } from '../types';

/** Hai uid sắp xếp rồi nối lại: hai người luôn ra cùng một chatId. */
export const getChatId = (a: string, b: string) => [a, b].sort().join('_');

/** Lắng nghe tin nhắn của một cuộc chat. Trả về unsubscribe. */
export function subscribeMessages(chatId: string, onNew: (m: Message) => void): Unsubscribe {
  const q = query(
    ref(db, `chats/${chatId}/messages`),
    orderByChild('createdAt'),
    limitToLast(100),
  );
  return onChildAdded(q, (snap) => {
    const v = snap.val() as Omit<Message, 'id'>;
    onNew({ id: snap.key ?? '', ...v });
  });
}

export interface SendParams {
  chatId: string;
  senderId: string;
  senderName: string;
  peerId: string;
  peerName: string;
  text?: string;
  location?: LatLng;
}

/**
 * Gửi tin nhắn text hoặc vị trí.
 * Ghi tin vào chats, cập nhật danh sách hội thoại của cả hai người,
 * rồi tăng số chưa đọc của người nhận.
 */
export async function sendMessage(p: SendParams): Promise<void> {
  const text = p.text?.trim() ?? '';
  const isLocation = !!p.location;
  if (!isLocation && !text) return; // không cho gửi tin rỗng

  const now = Date.now();
  const msgRef = push(ref(db, `chats/${p.chatId}/messages`));
  const preview = isLocation ? '📍 Vị trí' : text;

  const message = isLocation
    ? { senderId: p.senderId, type: 'location', location: p.location, createdAt: now }
    : { senderId: p.senderId, type: 'text', text, createdAt: now };

  // Dùng đường dẫn con (không ghi đè cả node) để không làm mất unread
  const updates: Record<string, unknown> = {
    [`chats/${p.chatId}/messages/${msgRef.key}`]: message,

    [`userChats/${p.senderId}/${p.chatId}/peerId`]: p.peerId,
    [`userChats/${p.senderId}/${p.chatId}/peerName`]: p.peerName,
    [`userChats/${p.senderId}/${p.chatId}/lastMessage`]: preview,
    [`userChats/${p.senderId}/${p.chatId}/lastTime`]: now,

    [`userChats/${p.peerId}/${p.chatId}/peerId`]: p.senderId,
    [`userChats/${p.peerId}/${p.chatId}/peerName`]: p.senderName,
    [`userChats/${p.peerId}/${p.chatId}/lastMessage`]: preview,
    [`userChats/${p.peerId}/${p.chatId}/lastTime`]: now,
  };

  await update(ref(db), updates);

  await runTransaction(
    ref(db, `userChats/${p.peerId}/${p.chatId}/unread`),
    (n: number | null) => (n ?? 0) + 1,
  );
}

/** Đặt số chưa đọc của mình về 0 khi mở cuộc trò chuyện. */
export function markAsRead(uid: string, chatId: string) {
  return update(ref(db, `userChats/${uid}/${chatId}`), { unread: 0 });
}

/** Danh sách hội thoại của user, mới nhất lên đầu. */
export function subscribeUserChats(uid: string, cb: (list: ChatSummary[]) => void): Unsubscribe {
  return onValue(ref(db, `userChats/${uid}`), (snap) => {
    const data = (snap.val() ?? {}) as Record<string, Partial<Omit<ChatSummary, 'chatId'>>>;
    const list: ChatSummary[] = Object.entries(data)
      .map(([chatId, d]) => ({
        chatId,
        peerId: d.peerId ?? '',
        peerName: d.peerName ?? '',
        lastMessage: d.lastMessage ?? '',
        lastTime: d.lastTime ?? 0,
        unread: d.unread ?? 0,
      }))
      .sort((a, b) => b.lastTime - a.lastTime);
    cb(list);
  });
}
