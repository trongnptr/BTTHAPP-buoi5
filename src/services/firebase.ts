import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thay bằng cấu hình của project Firebase bạn đã tạo
// (Project settings → Your apps → Web app → SDK setup and configuration)
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'XXXXXXXX',
  appId: '1:XXXXXXXX:web:XXXXXXXX',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Giữ đăng nhập sau khi tắt app. Khi Fast Refresh chạy lại file này,
// initializeAuth sẽ ném lỗi vì đã khởi tạo, nên lúc đó dùng getAuth.
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getDatabase(app);
