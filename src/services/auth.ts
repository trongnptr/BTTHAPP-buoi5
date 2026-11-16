import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './firebase';
import { goOffline } from './presence';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Sai email hoặc mật khẩu';
    case 'auth/invalid-email':
      return 'Email không hợp lệ';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu';
    case 'auth/too-many-requests':
      return 'Thử quá nhiều lần, vui lòng đợi rồi thử lại';
    case 'auth/network-request-failed':
      return 'Lỗi mạng, hãy kiểm tra kết nối';
    default:
      return 'Có lỗi xảy ra, vui lòng thử lại';
  }
}

export async function register({ name, email, password, confirmPassword }: RegisterInput) {
  const n = name.trim();
  const e = email.trim();
  if (!n) throw new Error('Vui lòng nhập họ tên');
  if (!EMAIL_RE.test(e)) throw new Error('Email không hợp lệ');
  if (password.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự');
  if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại không khớp');

  try {
    const { user } = await createUserWithEmailAndPassword(auth, e, password);
    await updateProfile(user, { displayName: n });
    // Lưu hồ sơ để người khác thấy trong Danh bạ
    await set(ref(db, `users/${user.uid}`), {
      name: n,
      email: e,
      online: false,
      lastSeen: Date.now(),
    });
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

export async function login(email: string, password: string) {
  const e = email.trim();
  if (!e || !password) throw new Error('Vui lòng nhập email và mật khẩu');
  try {
    await signInWithEmailAndPassword(auth, e, password);
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

export async function logout() {
  const uid = auth.currentUser?.uid;
  if (uid) await goOffline(uid);
  await signOut(auth);
}
