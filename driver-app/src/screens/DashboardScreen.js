import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function DashboardScreen({ driverData, setDriverData, trips, onSelectTrip, onNavigate }) {
  const activeTrip = trips.find(t => t.status === 'IN_TRANSIT') || trips.find(t => t.status === 'ASSIGNED');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning 👋</Text>
          <Text style={styles.driverName}>{driverData.name}</Text>
          <Text style={styles.driverId}>ID: {driverData.driverId} • {driverData.vehicle.plate}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => onNavigate('notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      {/* Online/Offline Duty Switch Card */}
      <View style={[styles.dutyCard, driverData.isOnline ? styles.dutyCardOnline : styles.dutyCardOffline]}>
        <View style={styles.dutyInfo}>
          <View style={[styles.statusDot, driverData.isOnline ? styles.dotOnline : styles.dotOffline]} />
          <View>
            <Text style={styles.dutyTitle}>
              {driverData.isOnline ? 'ON DUTY • ONLINE' : 'OFF DUTY • OFFLINE'}
            </Text>
            <Text style={styles.dutySubtext}>
              {driverData.isOnline ? 'Ready to receive & execute dispatches' : 'Turn online to receive new loads'}
            </Text>
          </View>
        </View>
        <Switch
          value={driverData.isOnline}
          onValueChange={(val) => setDriverData(prev => ({ ...prev, isOnline: val }))}
          trackColor={{ false: '#767577', true: '#34a853' }}
          thumbColor="#ffffff"
        />
      </View>

      {/* Active Trip Highlight */}
      {activeTrip && (
        <View style={styles.activeTripContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Dispatch</Text>
            <TouchableOpacity onPress={() => onSelectTrip(activeTrip)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>View Full Screen </Text>
              <Ionicons name="chevron-forward" size={16} color="#1a73e8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.activeCard} 
            activeOpacity={0.9}
            onPress={() => onSelectTrip(activeTrip)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, activeTrip.status === 'IN_TRANSIT' ? styles.badgeInTransit : styles.badgeAssigned]}>
                  <MaterialCommunityIcons 
                    name={activeTrip.status === 'IN_TRANSIT' ? "truck-fast-outline" : "clipboard-text-outline"} 
                    size={14} 
                    color={activeTrip.status === 'IN_TRANSIT' ? "#1a73e8" : "#b06000"} 
                  />
                  <Text style={[styles.badgeText, activeTrip.status === 'IN_TRANSIT' ? styles.badgeTextInTransit : styles.badgeTextAssigned]}>
                    {activeTrip.status === 'IN_TRANSIT' ? 'IN TRANSIT' : 'ASSIGNED'}
                  </Text>
                </View>
              </View>
              <Text style={styles.payout}>{activeTrip.payout}</Text>
            </View>

            <Text style={styles.cargoName}>{activeTrip.cargo}</Text>
            <Text style={styles.weightText}>Weight: {activeTrip.weight} • {activeTrip.distance}</Text>

            <View style={styles.routeBox}>
              <View style={styles.routePoint}>
                <Ionicons name="ellipse" size={10} color="#1a73e8" style={styles.iconMargin} />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>PICKUP ({activeTrip.origin.time})</Text>
                  <Text style={styles.routeAddress} numberOfLines={1}>{activeTrip.origin.address}</Text>
                </View>
              </View>

              <View style={styles.routeConnector} />

              <View style={styles.routePoint}>
                <Ionicons name="location" size={12} color="#ea4335" style={styles.iconMargin} />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>DROPOFF ({activeTrip.destination.time})</Text>
                  <Text style={styles.routeAddress} numberOfLines={1}>{activeTrip.destination.address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.customerText}>Client: {activeTrip.customer}</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onSelectTrip(activeTrip)}>
                <Ionicons name="navigate" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Open Navigation</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Stats Grid */}
      <Text style={styles.sectionTitle}>Shift Summary</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Feather name="box" size={24} color="#1a73e8" style={styles.statIcon} />
          <Text style={styles.statValue}>{driverData.stats.tripsCompletedToday}</Text>
          <Text style={styles.statLabel}>Trips Completed</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialCommunityIcons name="currency-usd" size={26} color="#137333" style={styles.statIcon} />
          <Text style={styles.statValue}>{driverData.stats.earningsToday}</Text>
          <Text style={styles.statLabel}>Est. Earnings</Text>
        </View>

        <View style={styles.statCard}>
          <Feather name="clock" size={24} color="#b06000" style={styles.statIcon} />
          <Text style={styles.statValue}>{driverData.stats.hoursOnline}</Text>
          <Text style={styles.statLabel}>Hours Driving</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#f29900" style={styles.statIcon} />
          <Text style={styles.statValue}>{driverData.stats.onTimeRate}</Text>
          <Text style={styles.statLabel}>On-Time Score</Text>
        </View>
      </View>

      {/* Quick SOS / Help Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.sosButton}>
          <Ionicons name="warning-outline" size={18} color="#c5221f" style={{ marginRight: 6 }} />
          <Text style={styles.sosButtonText}>Emergency SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.supportButton} onPress={() => onNavigate('profile')}>
          <Ionicons name="call-outline" size={18} color="#1a73e8" style={{ marginRight: 6 }} />
          <Text style={styles.supportButtonText}>Call Dispatcher</Text>
        </TouchableOpacity>
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
    padding: 16,
    paddingTop: 50,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  driverId: {
    fontSize: 13,
    color: '#495057',
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dutyCard: {
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    elevation: 2,
  },
  dutyCardOnline: {
    backgroundColor: '#e6f4ea',
    borderColor: '#ceead6',
    borderWidth: 1,
  },
  dutyCardOffline: {
    backgroundColor: '#f1f3f4',
    borderColor: '#dadce0',
    borderWidth: 1,
  },
  dutyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dotOnline: {
    backgroundColor: '#137333',
  },
  dotOffline: {
    backgroundColor: '#5f6368',
  },
  dutyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#202124',
  },
  dutySubtext: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 2,
  },
  activeTripContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  activeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#1a73e8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeInTransit: {
    backgroundColor: '#e8f0fe',
  },
  badgeAssigned: {
    backgroundColor: '#fef7e0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextInTransit: {
    color: '#1a73e8',
  },
  badgeTextAssigned: {
    color: '#b06000',
  },
  payout: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#137333',
  },
  cargoName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#202124',
    marginTop: 10,
  },
  weightText: {
    fontSize: 13,
    color: '#5f6368',
    marginTop: 2,
    marginBottom: 14,
  },
  routeBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 10,
    width: 14,
    textAlign: 'center',
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#dadce0',
    marginLeft: 6,
    marginVertical: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#70757a',
  },
  routeAddress: {
    fontSize: 13,
    color: '#202124',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 12,
  },
  customerText: {
    fontSize: 13,
    color: '#5f6368',
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sosButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fce8e6',
    borderColor: '#fad2cf',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#c5221f',
    fontWeight: 'bold',
    fontSize: 14,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#e8f0fe',
    borderColor: '#d2e3fc',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#1a73e8',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
