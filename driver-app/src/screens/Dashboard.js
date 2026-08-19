import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export default function Dashboard() {
  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, John Doe</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Available for Trips</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Trips</Text>
          
          {/* Placeholder for a trip card */}
          <TouchableOpacity style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripId}>Trip #TR-8429</Text>
              <Text style={styles.tripStatus}>Pending</Text>
            </View>
            <View style={styles.tripLocations}>
              <View style={styles.locationRow}>
                <View style={styles.dot} />
                <Text style={styles.locationText}>123 Warehouse St, City A</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.locationRow}>
                <View style={[styles.dot, styles.dotDestination]} />
                <Text style={styles.locationText}>456 Delivery Ave, City B</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f9',
  },
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#137333',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  tripId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tripStatus: {
    fontSize: 14,
    color: '#f29900',
    fontWeight: '600',
    backgroundColor: '#fef7e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tripLocations: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1a73e8',
    marginRight: 12,
  },
  dotDestination: {
    backgroundColor: '#ea4335',
  },
  line: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 4,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 15,
    color: '#444',
  },
  actionButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
