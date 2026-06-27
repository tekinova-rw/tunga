// ============================================================
// FILE: src/components/AIChat.tsx
// DESCRIPTION: AI Chat assistant component
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

interface AIMessage {
  id?: number;
  question: string;
  answer: string;
  created_at?: string;
}

export const AIChat = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai-chat/ask', {
        question: userQuestion,
      });

      if (response.data.data) {
        setMessages(prev => [
          ...prev,
          { question: userQuestion, answer: response.data.data.answer },
        ]);
      }
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Ask me anything about animal health!</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>🧑‍🌾 {item.question}</Text>
            </View>
            <View style={styles.answerContainer}>
              <Text style={styles.answerText}>🤖 {item.answer}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2E7D32" />
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about animal health..."
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !question.trim() && styles.sendButtonDisabled]}
          onPress={askAI}
          disabled={!question.trim() || isLoading}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B5E20',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
  },
  questionContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  questionText: {
    fontSize: 15,
    color: '#1B5E20',
  },
  answerContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  answerText: {
    fontSize: 15,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});