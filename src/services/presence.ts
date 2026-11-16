import { ref, onValue, onDisconnect, update, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

/**
 * Bật theo dõi trạng thái online của user.
 * Khi mất kết nối, server tự ghi online = false nhờ onDisconnect.
 * Trả về hàm hủy để gọi trong cleanup của useEffect.
 */
export function startPresence(uid: string): () => void {
  const connectedRef = ref(db, '.info/connected');
  const statusRef = ref(db, `users/${uid}`);

  const unsub = onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;
    onDisconnect(statusRef)
      .update({ online: false, lastSeen: serverTimestamp() })
      .then(() => update(statusRef, { online: true, lastSeen: serverTimestamp() }))
      .catch((e) => console.warn('presence error', e));
  });

  return () => {
    unsub();
    onDisconnect(statusRef).cancel().catch(() => {});
  };
}

/** Gọi trước khi đăng xuất, khi còn đăng nhập để ghi được quyền. */
export async function goOffline(uid: string): Promise<void> {
  const statusRef = ref(db, `users/${uid}`);
  await onDisconnect(statusRef).cancel().catch(() => {});
  await update(statusRef, { online: false, lastSeen: serverTimestamp() });
}
