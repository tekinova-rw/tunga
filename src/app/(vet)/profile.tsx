// src/app/(vet)/profile.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function VetProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Veterinarian Profile</Text>
      <Text>This is the vet profile screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});