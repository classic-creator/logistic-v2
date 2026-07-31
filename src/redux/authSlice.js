import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {
    name: 'Himangshu Sharma',
    email: 'h.sharma@logistics-v2.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  currentRole: 'Super Admin',
  availableRoles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager', 'Driver'],
  activeDriverId: 'DRV-001', // Pre-bound driver for the Driver Workflow simulator
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole: (state, action) => {
      state.currentRole = action.payload;
      // When switching to driver, ensure we bind to a valid active driver
      if (action.payload === 'Driver') {
        state.activeDriverId = 'DRV-001';
      }
    },
    setActiveDriverId: (state, action) => {
      state.activeDriverId = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.currentRole = null;
    }
  }
});

export const { setRole, setActiveDriverId, logout } = authSlice.actions;
export default authSlice.reducer;
