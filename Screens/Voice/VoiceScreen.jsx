import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar
} from 'react-native';
import * as Speech from 'expo-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * RenderMessageText
 * - Supports:
 *   - **bold**
 *   - *italic*
 *   - _italic_
 *   - `inline code`
 * - Trims inner content so patterns like "* italic name *" work correctly.
 */
function RenderMessageText({ text = '', style }) {
  // Regex supports bold, *italic*, _italic_, and inline code
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`)/gs;

  const parts = [];
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchedString = match[0];

    if (matchStart > lastIndex) {
      parts.push({
        key: `text-${idx++}`,
        text: text.slice(lastIndex, matchStart),
        type: 'text'
      });
    }

    // Bold (**bold**)
    if (matchedString.startsWith('**') && matchedString.endsWith('**')) {
      const content = matchedString.slice(2, -2).trim();
      parts.push({ key: `bold-${idx++}`, text: content, type: 'bold' });

    // Italic using *italic* (also handles "* italic name *")
    } else if (matchedString.startsWith('*') && matchedString.endsWith('*')) {
      const content = matchedString.slice(1, -1).trim();
      parts.push({ key: `italic-${idx++}`, text: content, type: 'italic' });

    // Italic using _italic_
    } else if (matchedString.startsWith('_') && matchedString.endsWith('_')) {
      const content = matchedString.slice(1, -1).trim();
      parts.push({ key: `italic-${idx++}`, text: content, type: 'italic' });

    // Inline code
    } else if (matchedString.startsWith('`') && matchedString.endsWith('`')) {
      const content = matchedString.slice(1, -1).trim();
      parts.push({ key: `code-${idx++}`, text: content, type: 'code' });

    } else {
      parts.push({ key: `text-${idx++}`, text: matchedString, type: 'text' });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      key: `text-${idx++}`,
      text: text.slice(lastIndex),
      type: 'text'
    });
  }

  return (
    <Text style={style}>
      {parts.map(part => {
        const lines = String(part.text).split('\n');
        return lines.map((line, i) => {
          let partStyle = undefined;
          if (part.type === 'bold') partStyle = { fontWeight: '700' };
          if (part.type === 'italic') partStyle = { fontStyle: 'italic' };
          if (part.type === 'code') partStyle = styles.inlineCode;

          return (
            <Text key={`${part.key}-line-${i}`} style={partStyle}>
              {line}
              {i !== lines.length - 1 ? '\n' : ''}
            </Text>
          );
        });
      })}
    </Text>
  );
}

/**
 * Remove or unwrap simple markdown-like markers before speaking.
 * Keeps the inner text but removes **, *, _, and backticks.
 */
function stripMarkupForSpeech(text = '') {
  if (!text) return '';

  let cleaned = text;

  // Unwrap bold (**text**) — allow surrounding spaces inside markers
  cleaned = cleaned.replace(/\*\*\s*(.+?)\s*\*\*/gs, '$1');

  // Unwrap *italic* (handles "* italic name *" too)
  cleaned = cleaned.replace(/\*\s*(.+?)\s*\*/gs, '$1');

  // Unwrap _italic_
  cleaned = cleaned.replace(/_\s*(.+?)\s*_ /gs, '$1'); // defensive
  cleaned = cleaned.replace(/_\s*(.+?)\s*_ /gs, '$1'); // defensive duplicate
  cleaned = cleaned.replace(/_\s*(.+?)\s*_/gs, '$1');

  // Unwrap inline code `code`
  cleaned = cleaned.replace(/`\s*(.+?)\s*`/gs, '$1');

  // Remove any stray asterisks (single * left) conservatively:
  cleaned = cleaned.replace(/(^|\s)\*(\s|$)/g, ' ');

  // Remove stray backticks
  cleaned = cleaned.replace(/(^|\s)`+(\s|$)/g, ' ');

  // Collapse multiple spaces and trim
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

/**
 * Shows words with a highlight on the currentIndex.
 */
function HighlightedSpeechText({ words = [], currentIndex = -1, style }) {
  return (
    <Text style={style}>
      {words.map((word, i) => {
        const highlightStyle = i === currentIndex ? styles.wordHighlight : null;
        // ensure trailing space
        return (
          <Text key={i} style={highlightStyle}>
            {word}
            {i !== words.length - 1 ? ' ' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  // IMPORTANT: Don't hardcode API keys in production. Use secure storage / env vars.
  // Replace the placeholder below with your method of supplying the API key.
  const [apiKey] = useState('AIzaSyBiIqpSdEMxaBgEmaLwNUkJ1yaU3q77KRM');

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenWords, setSpokenWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState(null);

  const scrollViewRef = useRef();

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  useEffect(() => {
    if (scrollViewRef.current) {
      try {
        scrollViewRef.current.scrollToEnd({ animated: true });
      } catch (e) {}
    }
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          if (scrollViewRef.current) {
            try {
              scrollViewRef.current.scrollToEnd({ animated: true });
            } catch (e) {}
          }
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const fetchGeminiResponse = async (prompt) => {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;

      if (typeof response === 'string') return response;
      if (typeof response.text === 'function') return response.text();
      if (typeof response.text === 'string') return response.text;

      return String(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I'm sorry, I encountered an error.";
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
    setCurrentWordIndex(-1);
    setSpokenWords([]);
    setCurrentSpeakingMessageId(null);
  };

  const handleSubmit = async (inputText = text) => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setText('');
    setLoading(true);

    try {
      const response = await fetchGeminiResponse(inputText);

      const assistantMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'assistant'
      };

      // add assistant message to chat
      setMessages(prev => [...prev, assistantMessage]);

      // Prepare cleaned text for speech (remove markdown markers)
      const speakText = stripMarkupForSpeech(response);
      const words = speakText.length ? speakText.split(/\s+/) : [];
      setSpokenWords(words);
      setCurrentWordIndex(-1);
      setCurrentSpeakingMessageId(assistantMessage.id);

      // Speak and track boundaries
      Speech.speak(speakText, {
        language: 'te-IN',
        pitch: 1,
        rate: 0.9,
        onStart: () => {
          setIsSpeaking(true);
        },
        // onBoundary is supported on some platforms — used to calculate word index from charIndex.
        // If your platform doesn't support it, the highlight may not move; still the rest works.
        onBoundary: (event) => {
          try {
            if (event && typeof event.charIndex === 'number') {
              const charIndex = event.charIndex;
              const upTo = speakText.slice(0, charIndex);
              // Count words before this charIndex
              const wordIndex = upTo.trim() ? upTo.trim().split(/\s+/).length - 1 : 0;
              if (wordIndex >= 0 && wordIndex < words.length) {
                setCurrentWordIndex(wordIndex);
              }
            }
          } catch (e) {
            // defensive - ignore boundary errors
          }
        },
        onDone: () => {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          setSpokenWords([]);
          setCurrentSpeakingMessageId(null);
        },
        onStopped: () => {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          setSpokenWords([]);
          setCurrentSpeakingMessageId(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          setSpokenWords([]);
          setCurrentSpeakingMessageId(null);
        }
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <FontAwesome5 name="robot" size={24} color="white" style={styles.logo} />
        <Text style={styles.title}>Laxmi-AI</Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          ref={scrollViewRef}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <FontAwesome5 name="comment-alt" size={80} color="#4CAF50" style={styles.welcomeIcon} />
              <Text style={styles.welcomeText}>Type a message to start chatting</Text>
            </View>
          ) : (
            messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userBubble : styles.assistantBubble
                ]}
              >
                {message.sender === 'assistant' && (
                  <FontAwesome5 name="robot" size={16} color="#4CAF50" style={styles.messageIcon} />
                )}

                <View style={{ flex: 1 }}>
                  {/* If this is the currently speaking assistant message -> show highlighted moving text */}
                  {message.sender === 'assistant' && isSpeaking && message.id === currentSpeakingMessageId ? (
                    <HighlightedSpeechText
                      words={spokenWords}
                      currentIndex={currentWordIndex}
                      style={styles.messageText}
                    />
                  ) : (
                    <RenderMessageText text={message.text} style={styles.messageText} />
                  )}
                </View>

                {message.sender === 'user' && (
                  <FontAwesome5 name="user" size={16} color="#4CAF50" style={styles.messageIcon} />
                )}
              </View>
            ))
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type your message..."
              placeholderTextColor="#666"
              onSubmitEditing={() => handleSubmit()}
            />

            {isSpeaking ? (
              <TouchableOpacity
                style={[styles.sendButton, styles.stopButton]}
                onPress={stopSpeaking}
              >
                <FontAwesome5 name="stop" size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSubmit()}
                disabled={loading}
              >
                <FontAwesome5 name="paper-plane" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#4CAF50',
    paddingBottom: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },

  logo: { marginRight: 10 },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },

  messagesContainer: { flex: 1, paddingHorizontal: 15 },

  messagesContent: { paddingTop: 20, paddingBottom: 120 },

  messageBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },

  assistantBubble: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },

  messageText: { fontSize: 16, color: '#333', flexShrink: 1, marginHorizontal: 5 },

  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  wordHighlight: {
    backgroundColor: 'yellow',
    borderRadius: 3,
  },

  messageIcon: { opacity: 0.7 },

  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },

  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
  },

  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stopButton: { backgroundColor: '#f44336' },

  welcomeContainer: { alignItems: 'center', paddingVertical: 100 },

  welcomeIcon: { marginBottom: 20, opacity: 0.7 },

  welcomeText: { fontSize: 18, color: '#666' },

  loadingContainer: { alignItems: 'center', padding: 20 },

  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },

  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0
  },
});
