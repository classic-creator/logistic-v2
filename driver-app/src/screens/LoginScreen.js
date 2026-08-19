import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { driverApi } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoDrivers, setDemoDrivers] = useState([]);
  const [fetchingDemo, setFetchingDemo] = useState(true);

  // Fetch backend drivers dynamically
  useEffect(() => {
    async function loadBackendDrivers() {
      setFetchingDemo(true);
      try {
        const drivers = await driverApi.getDemoDrivers();
        setDemoDrivers(drivers);
      } catch (err) {
        console.warn('Backend driver list unreachable.');
      } finally {
        setFetchingDemo(false);
      }
    }
    loadBackendDrivers();
  }, []);

  const handleManualLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your driver email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await driverApi.login(email, password);
      onLoginSuccess(res.user || { email, name: email.split('@')[0] }, res.token);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Unable to authenticate with backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (driver) => {
    setEmail(driver.email);
    setPassword('password123');
    onLoginSuccess(driver, 'session-token');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="truck-fast" size={42} color="#ffffff" />
        </View>
        <Text style={styles.appName}>Driver Portal</Text>
        <Text style={styles.appSubtitle}>Logistics Transport Management System</Text>
      </View>

      {/* Login Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In to Account</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={18} color="#70757a" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Driver Email Address"
            placeholderTextColor="#9aa0a6"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={18} color="#70757a" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9aa0a6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.loginBtn} 
          onPress={handleManualLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Backend Driver Select Section */}
      <View style={styles.demoSection}>
        <View style={styles.demoHeader}>
          <Ionicons name="server-outline" size={16} color="#1a73e8" style={{ marginRight: 6 }} />
          <Text style={styles.demoTitle}>Registered Backend Drivers</Text>
        </View>
        <Text style={styles.demoSub}>Select a driver account from your Laravel backend database:</Text>

        {fetchingDemo ? (
          <ActivityIndicator color="#1a73e8" style={{ marginVertical: 20 }} />
        ) : demoDrivers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No driver records returned from backend API.</Text>
          </View>
        ) : (
          demoDrivers.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              style={styles.demoDriverCard}
              onPress={() => handleDemoSelect(driver)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{driver.name ? driver.name.charAt(0) : 'D'}</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverVehicle}>{driver.vehicle?.model} • {driver.vehicle?.plate}</Text>
                <Text style={styles.driverEmail}>{driver.email}</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={26} color="#1a73e8" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#1a73e8',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#5f6368',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#202124',
  },
  loginBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoSection: {
    marginTop: 4,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  demoSub: {
    fontSize: 13,
    color: '#5f6368',
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#5f6368',
  },
  demoDriverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderColor: '#e8eaed',
    borderWidth: 1,
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarMiniText: {
    color: '#1a73e8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#202124',
  },
  driverVehicle: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 1,
  },
  driverEmail: {
    fontSize: 11,
    color: '#1a73e8',
    marginTop: 1,
  },
});
