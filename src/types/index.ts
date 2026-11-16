import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  online: boolean;
  lastSeen: number;
}

export interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'location';
  text?: string;
  location?: LatLng;
  createdAt: number;
}

export interface ChatSummary {
  chatId: string;
  peerId: string;
  peerName: string;
  lastMessage: string;
  lastTime: number;
  unread: number;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Chat: { chatId: string; peerId: string; peerName: string };
};

export type TabParamList = {
  Home: undefined;
  Contacts: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;
