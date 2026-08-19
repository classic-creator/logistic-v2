import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen({ driverData, onLogout }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Driver Card Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driverData.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{driverData.name}</Text>
        <Text style={styles.subtext}>Driver ID: {driverData.driverId}</Text>
        <Text style={styles.phone}>{driverData.phone}</Text>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#b06000" style={{ marginRight: 4 }} />
          <Text style={styles.ratingText}>{driverData.rating} Driver Rating</Text>
        </View>
      </View>

      {/* Vehicle Specification */}
      <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Truck Model:</Text>
          <Text style={styles.value}>{driverData.vehicle.model}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>License Plate:</Text>
          <Text style={styles.value}>{driverData.vehicle.plate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Max Capacity:</Text>
          <Text style={styles.value}>{driverData.vehicle.capacity}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fuel Tank Level:</Text>
          <Text style={styles.valueGreen}>{driverData.vehicle.fuelLevel}</Text>
        </View>
      </View>

      {/* Driver Documents Verification */}
      <Text style={styles.sectionTitle}>Compliance & Documents</Text>
      <View style={styles.card}>
        <View style={styles.docRow}>
          <Text style={styles.docName}>Commercial Driver License (CDL-A)</Text>
          <View style={styles.badgeVerified}>
            <Ionicons name="checkmark-circle" size={14} color="#137333" style={{ marginRight: 4 }} />
            <Text style={styles.docBadgeVerified}>Verified</Text>
          </View>
        </View>
        <View style={styles.docRow}>
          <Text style={styles.docName}>DOT Medical Examiner Card</Text>
          <View style={styles.badgeVerified}>
            <Ionicons name="checkmark-circle" size={14} color="#137333" style={{ marginRight: 4 }} />
            <Text style={styles.docBadgeVerified}>Verified</Text>
          </View>
        </View>
        <View style={styles.docRow}>
          <Text style={styles.docName}>Truck Commercial Insurance</Text>
          <View style={styles.badgeVerified}>
            <Ionicons name="checkmark-circle" size={14} color="#137333" style={{ marginRight: 4 }} />
            <Text style={styles.docBadgeVerified}>Verified</Text>
          </View>
        </View>
        <View style={styles.docRow}>
          <Text style={styles.docName}>HAZMAT Safety Permit</Text>
          <View style={styles.badgePending}>
            <Ionicons name="time-outline" size={14} color="#b06000" style={{ marginRight: 4 }} />
            <Text style={styles.docBadgePending}>Pending Review</Text>
          </View>
        </View>
      </View>

      {/* Driver Earnings Summary */}
      <Text style={styles.sectionTitle}>Earnings Overview</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Today's Earnings:</Text>
          <Text style={styles.earningVal}>{driverData.stats.earningsToday}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>This Week Total:</Text>
          <Text style={styles.earningVal}>$1,840.00</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Direct Deposit Account:</Text>
          <Text style={styles.value}>Chase **** 4892</Text>
        </View>
      </View>

      {/* Account Settings / Actions */}
      <TouchableOpacity 
        style={styles.settingsBtn}
        onPress={() => Alert.alert('Preferences', 'Driver App Settings & Dark Mode preferences.')}
      >
        <Ionicons name="settings-outline" size={18} color="#3c4043" style={{ marginRight: 8 }} />
        <Text style={styles.settingsBtnText}>App Settings & Preferences</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out of Driver Portal?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: onLogout }
        ])}
      >
        <Ionicons name="log-out-outline" size={18} color="#c5221f" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 90,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
  },
  subtext: {
    fontSize: 13,
    color: '#5f6368',
    marginTop: 2,
  },
  phone: {
    fontSize: 13,
    color: '#1a73e8',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef7e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
  },
  ratingText: {
    color: '#b06000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#5f6368',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
  },
  valueGreen: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#137333',
  },
  earningVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#137333',
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  docName: {
    fontSize: 13,
    color: '#3c4043',
    flex: 1,
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  docBadgeVerified: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#137333',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef7e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  docBadgePending: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b06000',
  },
  settingsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3c4043',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fce8e6',
    borderColor: '#fad2cf',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c5221f',
  },
});
