import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TripDetailScreen({ trip, onBack, onUpdateTripStatus }) {
  const [currentTrip, setCurrentTrip] = useState(trip);

  const handleAdvanceStatus = () => {
    let nextStatus = currentTrip.status;
    let updatedTimeline = [...currentTrip.timeline];

    if (currentTrip.status === 'ASSIGNED') {
      nextStatus = 'IN_TRANSIT';
      updatedTimeline[1].completed = true;
      updatedTimeline[1].time = 'JUST NOW';
      updatedTimeline[2].completed = true;
      updatedTimeline[2].time = 'JUST NOW';
      updatedTimeline[3].completed = true;
      updatedTimeline[3].time = 'JUST NOW';
    } else if (currentTrip.status === 'IN_TRANSIT') {
      nextStatus = 'DELIVERED';
      updatedTimeline[4].completed = true;
      updatedTimeline[4].time = 'JUST NOW';
    }

    const updated = {
      ...currentTrip,
      status: nextStatus,
      timeline: updatedTimeline,
    };
    setCurrentTrip(updated);
    onUpdateTripStatus(updated);
    Alert.alert('Status Updated!', `Trip is now marked as ${nextStatus.replace('_', ' ')}.`);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#1a73e8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentTrip.id}</Text>
        <Text style={styles.headerPayout}>{currentTrip.payout}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Header Banner */}
        <View style={styles.statusBanner}>
          <View>
            <Text style={styles.bannerLabel}>CURRENT STATUS</Text>
            <Text style={styles.bannerValue}>{currentTrip.status.replace('_', ' ')}</Text>
          </View>
          <MaterialCommunityIcons 
            name={currentTrip.status === 'DELIVERED' ? 'checkbox-marked-circle-outline' : currentTrip.status === 'IN_TRANSIT' ? 'truck-delivery-outline' : 'clipboard-text-outline'} 
            size={36} 
            color="#ffffff" 
          />
        </View>

        {/* GPS Live Navigation Visual Placeholder */}
        <View style={styles.mapCard}>
          <View style={styles.mapInner}>
            <Ionicons name="map-outline" size={32} color="#1a73e8" style={{ marginBottom: 6 }} />
            <Text style={styles.mapTitle}>Live GPS Route Guidance Active</Text>
            <Text style={styles.mapSub}>Distance remaining: {currentTrip.distance}</Text>
          </View>
          <TouchableOpacity 
            style={styles.openMapsBtn}
            onPress={() => Alert.alert('Launching Maps', `Navigating to ${currentTrip.destination.address}`)}
          >
            <Ionicons name="navigate" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.openMapsBtnText}>Start Turn-by-Turn GPS</Text>
          </TouchableOpacity>
        </View>

        {/* Cargo & Customer Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Load Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cargo Description:</Text>
            <Text style={styles.detailVal}>{currentTrip.cargo}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gross Weight:</Text>
            <Text style={styles.detailVal}>{currentTrip.weight}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client Name:</Text>
            <Text style={styles.detailVal}>{currentTrip.customer}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dispatcher:</Text>
            <Text style={styles.detailVal}>{currentTrip.dispatcher}</Text>
          </View>
        </View>

        {/* Pickup & Dropoff Addresses */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Route Milestones</Text>

          <View style={styles.milestone}>
            <Ionicons name="ellipse" size={12} color="#1a73e8" style={styles.mIcon} />
            <View style={styles.mInfo}>
              <Text style={styles.mTitle}>PICKUP LOCATION</Text>
              <Text style={styles.mName}>{currentTrip.origin.name}</Text>
              <Text style={styles.mAddress}>{currentTrip.origin.address}</Text>
              <Text style={styles.mTime}>Scheduled: {currentTrip.origin.time}</Text>
            </View>
          </View>

          <View style={styles.mLine} />

          <View style={styles.milestone}>
            <Ionicons name="location" size={14} color="#ea4335" style={styles.mIcon} />
            <View style={styles.mInfo}>
              <Text style={styles.mTitle}>DROPOFF DESTINATION</Text>
              <Text style={styles.mName}>{currentTrip.destination.name}</Text>
              <Text style={styles.mAddress}>{currentTrip.destination.address}</Text>
              <Text style={styles.mTime}>Estimated Arrival: {currentTrip.destination.time}</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        {currentTrip.notes ? (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="warning" size={16} color="#b06000" style={{ marginRight: 6 }} />
              <Text style={styles.notesTitle}>Special Dispatch Notes</Text>
            </View>
            <Text style={styles.notesBody}>{currentTrip.notes}</Text>
          </View>
        ) : null}

        {/* Execution Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Trip Checklist & History</Text>
          {currentTrip.timeline.map((step, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <Ionicons 
                name={step.completed ? "checkmark-circle" : "ellipse-outline"} 
                size={18} 
                color={step.completed ? "#137333" : "#bdc1c6"} 
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.timelineText, step.completed && styles.timelineTextDone]}>
                {step.step}
              </Text>
              <Text style={styles.timelineTime}>{step.time}</Text>
            </View>
          ))}
        </View>

        {/* Quick Contact Buttons */}
        <View style={styles.contactRow}>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => Alert.alert('Calling Customer', `Dialing ${currentTrip.customer}...`)}
          >
            <Ionicons name="call-outline" size={16} color="#1a73e8" style={{ marginRight: 6 }} />
            <Text style={styles.contactBtnText}>Call Receiver</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactBtnSec}
            onPress={() => Alert.alert('Calling Dispatch', `Dialing ${currentTrip.dispatcher}...`)}
          >
            <Ionicons name="headset-outline" size={16} color="#3c4043" style={{ marginRight: 6 }} />
            <Text style={styles.contactBtnSecText}>Call Dispatch</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button depending on state */}
        <View style={styles.actionSection}>
          {currentTrip.status !== 'DELIVERED' ? (
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleAdvanceStatus}>
              <Ionicons name="play" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionBtnText}>
                {currentTrip.status === 'ASSIGNED' ? 'START TRIP & IN TRANSIT' : 'MARK DELIVERED & COMPLETE'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBox}>
              <Ionicons name="checkmark-done-circle" size={22} color="#137333" style={{ marginRight: 6 }} />
              <Text style={styles.completedText}>Trip Successfully Delivered & Signed</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontSize: 15,
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  headerPayout: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#137333',
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  statusBanner: {
    backgroundColor: '#1a73e8',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerLabel: {
    color: '#d2e3fc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bannerValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mapCard: {
    backgroundColor: '#202124',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  mapInner: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  mapTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  mapSub: {
    color: '#bdc1c6',
    fontSize: 13,
    marginTop: 2,
  },
  openMapsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  openMapsBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#5f6368',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
    maxWidth: '60%',
    textAlign: 'right',
  },
  milestone: {
    flexDirection: 'row',
  },
  mIcon: {
    marginRight: 12,
    marginTop: 4,
    width: 14,
    textAlign: 'center',
  },
  mLine: {
    width: 2,
    height: 24,
    backgroundColor: '#dadce0',
    marginLeft: 6,
    marginVertical: 2,
  },
  mInfo: {
    flex: 1,
  },
  mTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#70757a',
  },
  mName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#202124',
  },
  mAddress: {
    fontSize: 13,
    color: '#5f6368',
  },
  mTime: {
    fontSize: 12,
    color: '#1a73e8',
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: '#fef7e0',
    borderColor: '#fce8e6',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b06000',
  },
  notesBody: {
    fontSize: 13,
    color: '#3c4043',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineText: {
    fontSize: 14,
    color: '#80868b',
    flex: 1,
  },
  timelineTextDone: {
    color: '#202124',
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 12,
    color: '#70757a',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactBtnText: {
    color: '#1a73e8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  contactBtnSec: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactBtnSecText: {
    color: '#3c4043',
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionSection: {
    marginTop: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#137333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  completedBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#e6f4ea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedText: {
    color: '#137333',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
