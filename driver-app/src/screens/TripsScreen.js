import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function TripsScreen({ trips, onSelectTrip }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrips = trips.filter(trip => {
    const matchesFilter = filter === 'ALL' || trip.status === filter;
    const matchesSearch = trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trip.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trip.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips & Dispatches</Text>
        <Text style={styles.subtitle}>{trips.length} Total Loads Assigned</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#70757a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Trip ID, cargo, or client..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9aa0a6"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#70757a" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {['ALL', 'IN_TRANSIT', 'ASSIGNED', 'DELIVERED'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.activeTab]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
              {tab === 'ALL' ? 'All' : tab === 'IN_TRANSIT' ? 'In Transit' : tab === 'ASSIGNED' ? 'Assigned' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trips List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="truck" size={42} color="#9aa0a6" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No trips found matching filter.</Text>
          </View>
        ) : (
          filteredTrips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => onSelectTrip(trip)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.idContainer}>
                  <Text style={styles.tripId}>{trip.id}</Text>
                  <Text style={[
                    styles.statusBadge,
                    trip.status === 'IN_TRANSIT' && styles.badgeInTransit,
                    trip.status === 'ASSIGNED' && styles.badgeAssigned,
                    trip.status === 'DELIVERED' && styles.badgeDelivered,
                  ]}>
                    {trip.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.payout}>{trip.payout}</Text>
              </View>

              <Text style={styles.cargo}>{trip.cargo}</Text>
              <Text style={styles.meta}>{trip.weight} • {trip.distance}</Text>

              <View style={styles.divider} />

              <View style={styles.locationContainer}>
                <Text style={styles.locLabel}>FROM:</Text>
                <Text style={styles.locText} numberOfLines={1}>{trip.origin.address}</Text>
              </View>

              <View style={styles.locationContainer}>
                <Text style={styles.locLabel}>TO:</Text>
                <Text style={styles.locText} numberOfLines={1}>{trip.destination.address}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.clientText}>Client: {trip.customer}</Text>
                <View style={styles.viewDetailRow}>
                  <Text style={styles.viewDetailText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color="#1a73e8" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    color: '#5f6368',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dadce0',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#202124',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8eaed',
  },
  activeTab: {
    backgroundColor: '#1a73e8',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c4043',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#5f6368',
  },
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#202124',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeInTransit: {
    backgroundColor: '#e8f0fe',
    color: '#1a73e8',
  },
  badgeAssigned: {
    backgroundColor: '#fef7e0',
    color: '#b06000',
  },
  badgeDelivered: {
    backgroundColor: '#e6f4ea',
    color: '#137333',
  },
  payout: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#137333',
  },
  cargo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
  },
  meta: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f3f4',
    marginVertical: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#70757a',
    width: 45,
  },
  locText: {
    fontSize: 13,
    color: '#3c4043',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  clientText: {
    fontSize: 12,
    color: '#5f6368',
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: 13,
    color: '#1a73e8',
    fontWeight: 'bold',
    marginRight: 2,
  },
});
