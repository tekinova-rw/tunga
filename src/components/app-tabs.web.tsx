// src/components/app-tabs.web.tsx
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth-store';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

// Tab configuration by role
const getTabsByRole = (role: string | undefined) => {
  switch (role) {
    case 'farmer':
      return [
        { name: 'home', href: '/(farmer)/dashboard', label: 'Home' },
        { name: 'animals', href: '/(farmer)/animals', label: 'Animals' },
        { name: 'requests', href: '/(farmer)/requests', label: 'Requests' },
        { name: 'explore', href: '/(farmer)/explore', label: 'Explore' },
        { name: 'profile', href: '/(farmer)/profile', label: 'Profile' },
      ];
    case 'veterinarian':
      return [
        { name: 'home', href: '/(vet)/dashboard', label: 'Home' },
        { name: 'requests', href: '/(vet)/requests', label: 'Requests' },
        { name: 'appointments', href: '/(vet)/appointments', label: 'Appointments' },
        { name: 'explore', href: '/(vet)/explore', label: 'Explore' },
        { name: 'profile', href: '/(vet)/profile', label: 'Profile' },
      ];
    case 'super_admin':
    case 'district_admin':
      return [
        { name: 'home', href: '/(admin)/dashboard', label: 'Dashboard' },
        { name: 'users', href: '/(admin)/users', label: 'Users' },
        { name: 'reports', href: '/(admin)/reports', label: 'Reports' },
        { name: 'explore', href: '/(admin)/explore', label: 'Explore' },
        { name: 'profile', href: '/(admin)/profile', label: 'Profile' },
      ];
    default:
      return [
        { name: 'home', href: '/', label: 'Home' },
        { name: 'explore', href: '/explore', label: 'Explore' },
      ];
  }
};

export default function AppTabs() {
  const { user } = useAuthStore();
  const tabs = getTabsByRole(user?.role);

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {tabs.map((tab) => (
            <TabTrigger 
              key={tab.name} 
              name={tab.name} 
              href={{ pathname: tab.href } as any} 
              asChild
            >
              <TabButton>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuthStore();
  
  // Get app name based on role
  const getAppName = () => {
    if (user?.role === 'farmer') return 'VetConnect Farmer';
    if (user?.role === 'veterinarian') return 'VetConnect Professional';
    if (user?.role === 'super_admin' || user?.role === 'district_admin') return 'VetConnect Admin';
    return 'VetConnect Rwanda';
  };

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          {getAppName()}
        </ThemedText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link">Help</ThemedText>
            <SymbolView
              tintColor={colors.text}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});