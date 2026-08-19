import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TripsScreen from './src/screens/TripsScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import BottomNavBar from './src/components/BottomNavBar';

import { driverApi, setAuthToken, API_BASE_URL } from './src/services/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync with Laravel Backend dynamically
  useEffect(() => {
    async function syncBackendData() {
      setLoading(true);
      try {
        await driverApi.checkHealth();
        setIsConnectedToBackend(true);

        // Fetch live trips & notifications
        try {
          const liveTrips = await driverApi.getTrips();
          setTrips(liveTrips || []);
        } catch (e) {
          setTrips([]);
        }

        try {
          const liveNotifications = await driverApi.getNotifications();
          setNotifications(liveNotifications || []);
        } catch (e) {
          setNotifications([]);
        }
      } catch (err) {
        setIsConnectedToBackend(false);
      } finally {
        setLoading(false);
      }
    }
    syncBackendData();
  }, []);

  const handleLoginSuccess = (user, token) => {
    if (token) {
      setAuthToken(token);
    }
    setDriverData(user);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    setSelectedTrip(null);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsLoggedIn(false);
    setDriverData(null);
    setSelectedTrip(null);
    setActiveTab('dashboard');
  };

  const handleUpdateTripStatus = async (updatedTrip) => {
    // 1. Update UI state immediately
    setTrips(prevTrips => prevTrips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    if (selectedTrip && selectedTrip.id === updatedTrip.id) {
      setSelectedTrip(updatedTrip);
    }

    // 2. Persist update in Laravel Backend
    try {
      if (updatedTrip.status === 'IN_TRANSIT') {
        await driverApi.startTrip(updatedTrip.id);
      } else if (updatedTrip.status === 'DELIVERED') {
        await driverApi.markDelivered(updatedTrip.id);
      }
    } catch (err) {
      console.warn('Backend status update error:', err.message);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Connecting to Logistics System...</Text>
      </View>
    );
  }

  if (!isLoggedIn || !driverData) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.apiRibbon, isConnectedToBackend ? styles.apiOnline : styles.apiDemo]}>
          <Text style={styles.apiRibbonText}>
            {isConnectedToBackend ? `🟢 Connected to Laravel API (${API_BASE_URL})` : '🟡 Offline Mode (Run `php artisan serve --host=0.0.0.0`)'}
          </Text>
        </View>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Backend Connectivity Status Ribbon */}
      <View style={[styles.apiRibbon, isConnectedToBackend ? styles.apiOnline : styles.apiDemo]}>
        <Text style={styles.apiRibbonText}>
          {isConnectedToBackend ? `🟢 Synced with Live Laravel Backend (${API_BASE_URL})` : '🟡 Offline Mode (Run `php artisan serve --host=0.0.0.0`)'}
        </Text>
      </View>

      {/* Screen Router */}
      <View style={styles.screenContainer}>
        {selectedTrip ? (
          <TripDetailScreen
            trip={selectedTrip}
            onBack={() => setSelectedTrip(null)}
            onUpdateTripStatus={handleUpdateTripStatus}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen
            driverData={driverData}
            setDriverData={setDriverData}
            trips={trips}
            onSelectTrip={handleSelectTrip}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        ) : activeTab === 'trips' ? (
          <TripsScreen
            trips={trips}
            onSelectTrip={handleSelectTrip}
          />
        ) : activeTab === 'notifications' ? (
          <NotificationsScreen
            notifications={notifications}
            onClearNotifications={() => setNotifications([])}
          />
        ) : activeTab === 'profile' ? (
          <ProfileScreen
            driverData={driverData}
            onLogout={handleLogout}
          />
        ) : null}
      </View>

      {/* Persistent Bottom Navigation Bar */}
      {!selectedTrip && (
        <BottomNavBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            setSelectedTrip(null);
            setActiveTab(tab);
          }}
          unreadCount={unreadCount}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  apiRibbon: {
    paddingTop: 30,
    paddingBottom: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  apiOnline: {
    backgroundColor: '#e6f4ea',
  },
  apiDemo: {
    backgroundColor: '#fef7e0',
  },
  apiRibbonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3c4043',
  },
  screenContainer: {
    flex: 1,
  },
});
