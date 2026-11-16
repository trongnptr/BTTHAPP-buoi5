# Bài 5: Chat 1-1 realtime với Firebase (React Native CLI)

Project này dùng React Native CLI (không Expo), TypeScript, React Navigation và Firebase JS SDK.

## 1. Tạo project và cài thư viện

```bash
npx @react-native-community/cli@latest init ChatApp --skip-install
cd ChatApp
```

Sao chép các file trong thư mục này vào project vừa tạo. Ghi đè `App.tsx`, thêm thư mục `src/` và file `database.rules.json`.

Cài thư viện:

```bash
npm i firebase@^11.10.0 @react-native-async-storage/async-storage @react-native-community/geolocation
npm i @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm i react-native-screens react-native-safe-area-context
```

Với iOS, chạy thêm `cd ios && pod install && cd ..`.

Không cần `google-services.json` hay `GoogleService-Info.plist` vì app dùng Firebase JS SDK với cấu hình viết trực tiếp trong code.

## 2. Cấu hình Firebase Console

1. Tạo project, thêm một **Web app** để lấy `firebaseConfig`.
2. Dán cấu hình vào `src/services/firebase.ts`, nhớ sửa `databaseURL` đúng với region bạn chọn.
3. **Authentication** → Sign-in method → bật **Email/Password**.
4. **Realtime Database** → Create database → chọn region. Tab **Rules**: dán nội dung `database.rules.json` rồi Publish.

## 3. Quyền truy cập

**Android**, thêm vào `android/app/src/main/AndroidManifest.xml` (trong thẻ `<manifest>`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS**, thêm vào `ios/ChatApp/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Cần vị trí để gửi vị trí trong chat</string>
```

## 4. Chạy app

```bash
npx react-native start
npx react-native run-android   # hoặc run-ios
```

## 5. Cấu trúc dữ liệu

```
users/{uid}                        { name, email, online, lastSeen }
chats/{chatId}/messages/{msgId}    { senderId, type: 'text'|'location', text | location, createdAt }
userChats/{uid}/{chatId}           { peerId, peerName, lastMessage, lastTime, unread }
```

`chatId` là hai uid sắp xếp rồi nối bằng `_`.

## 6. Cấu trúc thư mục

```
App.tsx
database.rules.json
src/
  services/     firebase.ts, auth.ts, presence.ts, users.ts, chat.ts, location.ts
  context/      AuthContext.tsx
  navigation/   RootNavigator.tsx, MainTabs.tsx
  screens/      LoginScreen, RegisterScreen, HomeScreen, ContactsScreen,
                ChatScreen, NotificationsScreen, SettingsScreen
  components/   Avatar.tsx
  utils/        format.ts
  types/        index.ts
  theme.ts
```

## 7. Ghi chú

- **Màn hình Thông báo:** Bài 4 không có màn hình này nên màn Thông báo được làm mới. Nó liệt kê các cuộc trò chuyện còn tin chưa đọc và hiện số chưa đọc trên tab.
- **Trạng thái online:** dùng `.info/connected` và `onDisconnect`, nên khi app bị tắt hoặc mất mạng, trạng thái tự chuyển về offline.
- **Hủy listener:** mọi `onValue` và `onChildAdded` đều trả về hàm hủy và được gọi trong cleanup của `useEffect`.
- **Thời gian tin nhắn** lấy từ đồng hồ thiết bị gửi (`Date.now()`). Với bài tập đủ dùng. Nếu cần thứ tự chính xác tuyệt đối giữa các thiết bị, đổi sang `serverTimestamp()`.
- Chưa chạy build trên máy thật trong lúc viết, nên nếu có lỗi khi `npm run` hoặc khi build, gửi log cho tôi để sửa.
