import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  notifications: [
    { id: 1, type: 'warning', message: 'Vehicle MH-12-QW-5689 fitness certificate expires in 5 days.', time: '10m ago', read: false },
    { id: 2, type: 'info', message: 'Driver Rajesh Kumar completed Trip TRP-1002 successfully.', time: '1h ago', read: false },
    { id: 3, type: 'error', message: 'Alert: Trip TRP-1004 (Delhivery) is delayed by 45 mins.', time: '2h ago', read: false }
  ],
  theme: 'dark'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: Date.now(),
        read: false,
        time: 'Just now',
        ...action.payload
      });
    },
    markAllRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const { toggleSidebar, addNotification, markAllRead, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;
