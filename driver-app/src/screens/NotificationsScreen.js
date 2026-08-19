import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationsScreen({ notifications, onClearNotifications }) {
  const [items, setItems] = useState(notifications);

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dispatch Alerts</Text>
          <Text style={styles.subtitle}>System & Load Notifications</Text>
        </View>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={42} color="#9aa0a6" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No notifications at this time.</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={[styles.card, item.unread && styles.unreadCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  {item.type === 'TRIP_ASSIGNED' ? (
                    <Ionicons name="cube-outline" size={20} color="#1a73e8" />
                  ) : item.type === 'ALERT' ? (
                    <Ionicons name="warning-outline" size={20} color="#b06000" />
                  ) : (
                    <MaterialCommunityIcons name="cash-check" size={22} color="#137333" />
                  )}
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                {item.unread && <View style={styles.dot} />}
              </View>
              <Text style={styles.message}>{item.message}</Text>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  markReadText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#5f6368',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  unreadCard: {
    backgroundColor: '#f0f4f9',
    borderColor: '#d2e3fc',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#202124',
  },
  time: {
    fontSize: 11,
    color: '#70757a',
    marginTop: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
  },
  message: {
    fontSize: 13,
    color: '#3c4043',
    lineHeight: 18,
  },
});
