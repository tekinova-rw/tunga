// ============================================================
// FILE: src/app/(admin)/ai-chat.tsx
// DESCRIPTION: AI Chat assistant screen for admins
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/api/axios';

interface AIMessage {
  question: string;
  answer: string;
  created_at?: string;
}

export default function AdminAIChatScreen() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();

  const askAI = async () => {
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);

    try {
      // ✅ Use the api instance with proper URL
      const response = await api.post('/ai-chat/ask', {
        question: userQuestion,
      });

      const data = response.data;

      if (data.success) {
        setMessages(prev => [
          ...prev,
          { question: userQuestion, answer: data.data.answer },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('AI error:', error);
      
      // Better error handling
      let errorMessage = 'Failed to get AI response. Please try again.';
      
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to the AI service. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'AI service not available. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickQuestions = () => {
    return [
      'How many users are in the system?',
      'What are the most common animal diseases?',
      'How to improve vet services?',
      'What are the key metrics for animal health?',
      'How to manage user roles?',
    ];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Get insights and help from AI</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Ask me anything!</Text>
          <Text style={styles.emptySubtitle}>
            I can help with system insights, reports, and administrative tasks.
          </Text>
          <View style={styles.quickQuestions}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            {getQuickQuestions().map((q, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => setQuestion(q)}
              >
                <Text style={styles.quickQuestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>📊 {item.question}</Text>
              </View>
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>🤖 {item.answer}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.messagesList}
        />
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#D32F2F" />
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about system management..."
          value={question}
          onChangeText={setQuestion}
          multiline
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!question.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={askAI}
          disabled={!question.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    color: '#B71C1C',
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
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  questionText: {
    fontSize: 15,
    color: '#B71C1C',
  },
  answerContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  answerText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
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
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#B71C1C',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  quickQuestions: {
    width: '100%',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickQuestionButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#D32F2F',
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
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});