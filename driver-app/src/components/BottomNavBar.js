import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar({ activeTab, onTabPress, unreadCount }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'trips', label: 'My Trips', icon: 'navigate-outline', activeIcon: 'navigate' },
    { id: 'notifications', label: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications', badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const iconName = isActive ? tab.activeIcon : tab.icon;
        const iconColor = isActive ? '#1a73e8' : '#70757a';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName} size={24} color={iconColor} />
              {tab.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 5,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ea4335',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 11,
    color: '#70757a',
    marginTop: 3,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
});
