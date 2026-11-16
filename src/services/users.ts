import { ref, onValue, Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import { UserProfile } from '../types';

type RawUser = Partial<Omit<UserProfile, 'uid'>>;

function toProfile(uid: string, d: RawUser): UserProfile {
  return {
    uid,
    name: d.name ?? '',
    email: d.email ?? '',
    online: !!d.online,
    lastSeen: d.lastSeen ?? 0,
  };
}

/** Realtime danh sách toàn bộ user. Trả về unsubscribe. */
export function subscribeUsers(cb: (users: UserProfile[]) => void): Unsubscribe {
  return onValue(ref(db, 'users'), (snap) => {
    const data = (snap.val() ?? {}) as Record<string, RawUser>;
    cb(Object.entries(data).map(([uid, d]) => toProfile(uid, d)));
  });
}

/** Realtime một user (dùng để theo dõi online của đối phương). */
export function subscribeUser(uid: string, cb: (u: UserProfile | null) => void): Unsubscribe {
  return onValue(ref(db, `users/${uid}`), (snap) => {
    const d = snap.val() as RawUser | null;
    cb(d ? toProfile(uid, d) : null);
  });
}
