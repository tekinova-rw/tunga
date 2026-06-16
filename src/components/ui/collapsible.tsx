// src/components/ui/collapsible.tsx (No Reanimated)
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps extends PropsWithChildren {
  title: string;
  defaultOpen?: boolean;
}

export function Collapsible({ children, title, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const theme = useTheme();

  const toggleCollapsible = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.heading,
          pressed && styles.pressedHeading,
        ]}
        onPress={toggleCollapsible}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? `Collapse ${title}` : `Expand ${title}`}
      >
        <ThemedView type="backgroundElement" style={styles.button}>
          <ThemedText style={[styles.chevron, { color: theme.text, transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }]}>
            ▶
          </ThemedText>
        </ThemedView>

        <ThemedText type="small" style={styles.title}>
          {title}
        </ThemedText>
      </Pressable>
      
      {isOpen && (
        <ThemedView type="backgroundElement" style={styles.content}>
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressedHeading: {
    opacity: 0.7,
  },
  button: {
    width: Spacing.four,
    height: Spacing.four,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  content: {
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    marginLeft: Spacing.four,
    padding: Spacing.four,
  },
  chevron: {
    fontSize: 12,
  },
});