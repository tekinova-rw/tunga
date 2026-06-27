// ============================================================
// FILE: src/app/(admin)/reports.tsx
// DESCRIPTION: Reports screen for admins
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/axios';
import { useAuthStore } from '../../store/auth-store';

type ReportStats = {
  totalUsers: number;
  totalFarmers: number;
  totalVets: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  pendingUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  rejectedUsers: number;
};

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const { token, user } = useAuthStore();

  const isSuperAdmin = user?.role === 'super_admin';

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      const data = response.data.data || response.data;
      setStats(data);
    } catch (err) {
      console.log('Load reports error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) loadReports();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
          <Text style={styles.statValue}>{value || 0}</Text>
          <Text style={styles.statLabel}>{title}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D32F2F']} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Reports</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>System Statistics</Text>
        <Text style={styles.subHeaderSubtitle}>
          {isSuperAdmin ? 'Global view' : 'District view'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers} 
          icon="people-outline" 
          color="#2196F3" 
        />
        <StatCard 
          title="Farmers" 
          value={stats?.totalFarmers} 
          icon="person-outline" 
          color="#4CAF50" 
        />
        <StatCard 
          title="Veterinarians" 
          value={stats?.totalVets} 
          icon="medkit-outline" 
          color="#9C27B0" 
        />
        <StatCard 
          title="Admins" 
          value={stats?.totalAdmins} 
          icon="shield-outline" 
          color="#D32F2F" 
        />
        <StatCard 
          title="Super Admins" 
          value={stats?.totalSuperAdmins} 
          icon="crown-outline" 
          color="#D32F2F" 
        />
        <StatCard 
          title="Pending" 
          value={stats?.pendingUsers} 
          icon="time-outline" 
          color="#FF9800" 
        />
        <StatCard 
          title="Active" 
          value={stats?.activeUsers} 
          icon="checkmark-circle-outline" 
          color="#4CAF50" 
        />
        <StatCard 
          title="Suspended" 
          value={stats?.suspendedUsers} 
          icon="pause-circle-outline" 
          color="#f44336" 
        />
        <StatCard 
          title="Rejected" 
          value={stats?.rejectedUsers} 
          icon="close-circle-outline" 
          color="#D32F2F" 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#D32F2F',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 32,
  },
  subHeader: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    marginBottom: 12,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});