// src/components/app-tabs.tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme, Platform } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuthStore();

  // Determine role-based routes
  const isFarmer = user?.role === 'farmer';
  const isVet = user?.role === 'veterinarian';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'district_admin';

  // Role-specific tab configurations
  const getTabs = () => {
    if (isFarmer) {
      return [
        {
          name: 'index',
          label: 'Home',
          icon: require('@/assets/images/tabIcons/home.png'),
        },
        {
          name: 'animals',
          label: 'Animals',
          icon: require('@/assets/images/tabIcons/animals.png'),
        },
        {
          name: 'requests',
          label: 'Requests',
          icon: require('@/assets/images/tabIcons/requests.png'),
        },
        {
          name: 'explore',
          label: 'Explore',
          icon: require('@/assets/images/tabIcons/explore.png'),
        },
        {
          name: 'profile',
          label: 'Profile',
          icon: require('@/assets/images/tabIcons/profile.png'),
        },
      ];
    }
    
    if (isVet) {
      return [
        {
          name: 'index',
          label: 'Home',
          icon: require('@/assets/images/tabIcons/home.png'),
        },
        {
          name: 'requests',
          label: 'Requests',
          icon: require('@/assets/images/tabIcons/requests.png'),
        },
        {
          name: 'appointments',
          label: 'Appointments',
          icon: require('@/assets/images/tabIcons/appointments.png'),
        },
        {
          name: 'explore',
          label: 'Explore',
          icon: require('@/assets/images/tabIcons/explore.png'),
        },
        {
          name: 'profile',
          label: 'Profile',
          icon: require('@/assets/images/tabIcons/profile.png'),
        },
      ];
    }
    
    if (isAdmin) {
      return [
        {
          name: 'index',
          label: 'Dashboard',
          icon: require('@/assets/images/tabIcons/home.png'),
        },
        {
          name: 'users',
          label: 'Users',
          icon: require('@/assets/images/tabIcons/users.png'),
        },
        {
          name: 'reports',
          label: 'Reports',
          icon: require('@/assets/images/tabIcons/reports.png'),
        },
        {
          name: 'explore',
          label: 'Explore',
          icon: require('@/assets/images/tabIcons/explore.png'),
        },
        {
          name: 'profile',
          label: 'Profile',
          icon: require('@/assets/images/tabIcons/profile.png'),
        },
      ];
    }
    
    // Default tabs for unauthenticated or unknown role
    return [
      {
        name: 'index',
        label: 'Home',
        icon: require('@/assets/images/tabIcons/home.png'),
      },
      {
        name: 'explore',
        label: 'Explore',
        icon: require('@/assets/images/tabIcons/explore.png'),
      },
    ];
  };

  const tabs = getTabs();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={tab.icon}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}