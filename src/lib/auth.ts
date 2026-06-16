import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveToken(token: string) {
  await AsyncStorage.setItem('token', token);
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}

export async function logout() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}