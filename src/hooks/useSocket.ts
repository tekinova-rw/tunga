// ============================================================
// FILE: src/hooks/useSocket.ts
// DESCRIPTION: Socket.IO hook for React Native
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// ✅ Platform-aware storage helper
const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('accessToken');
    }
    // Use dynamic import for SecureStore on native
    const SecureStore = require('expo-secure-store');
    return await SecureStore.getItemAsync('accessToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// ✅ FIX: Use your computer's IP address (10.7.33.242)
const getSocketUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // ✅ For Android Emulator OR Physical Device - use your IP
      return 'http://10.7.33.242:5000';  // ← Your IP from ipconfig
    }
    if (Platform.OS === 'ios') {
      // ✅ For iOS Simulator OR Physical Device - use your IP
      return 'http://10.7.33.242:5000';  // ← Your IP from ipconfig
      // return 'http://localhost:5000';  // ← Use this for iOS Simulator only
    }
    // For physical device - use your computer's IP
    return 'http://10.7.33.242:5000';
  }
  return 'https://api.vetconnect.rw';
};

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const token = await getToken();
        
        if (!token) {
          console.log('❌ No token found, skipping socket connection');
          return;
        }

        console.log('🔌 Connecting to socket...');

        const socket = io(getSocketUrl(), {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        socket.on('connect', () => {
          console.log('✅ Socket connected');
          setIsConnected(true);
          setSocketId(socket.id || null);
        });

        socket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          setIsConnected(false);
          setSocketId(null);
        });

        socket.on('connect_error', (error) => {
          console.log('❌ Socket connection error:', error.message);
          setIsConnected(false);
        });

        socket.on('receive_message', (data) => {
          console.log('📩 Received message:', data);
          // You can emit this to a specific event handler in your components
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('Socket connection error:', error);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinRoom = (conversationId: number) => {
    if (socketRef.current && isConnected) {
      console.log(`📥 Joining room: room_${conversationId}`);
      socketRef.current.emit('join_room', conversationId);
    }
  };

  const leaveRoom = (conversationId: number) => {
    if (socketRef.current && isConnected) {
      console.log(`📤 Leaving room: room_${conversationId}`);
      socketRef.current.emit('leave_room', conversationId);
    }
  };

  const sendMessage = (conversationId: number, message: string, image_url?: string) => {
    if (socketRef.current && isConnected) {
      console.log(`💬 Sending message to room: room_${conversationId}`);
      socketRef.current.emit('send_message', {
        conversationId,
        message,
        image_url,
      });
    } else {
      console.log('❌ Cannot send message - socket not connected');
    }
  };

  const markAsRead = (conversationId: number, messageId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', {
        conversationId,
        messageId,
      });
    }
  };

  const markAllAsRead = (conversationId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_all_read', {
        conversationId,
      });
    }
  };

  const typing = (conversationId: number, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', {
        conversationId,
        isTyping,
      });
    }
  };

  const getOnlineUsers = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('get_online_users');
    }
  };

  // Listen for public messages
  const onPublicMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('public_message', callback);
    }
  };

  // Listen for private messages
  const onReceiveMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('receive_message', callback);
    }
  };

  // Listen for typing indicators
  const onUserTyping = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
    }
  };

  // Remove listeners
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    socketId,
    joinRoom,
    leaveRoom,
    sendMessage,
    markAsRead,
    markAllAsRead,
    typing,
    getOnlineUsers,
    onPublicMessage,
    onReceiveMessage,
    onUserTyping,
    off,
  };
};

export default useSocket;