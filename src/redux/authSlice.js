import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  currentRole: null,
  availableRoles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager', 'Driver'],
  activeDriverId: null,
  isAuthInitialized: false, // Tracks whether the initial token check has completed
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole: (state, action) => {
      state.currentRole = action.payload;
    },
    setActiveDriverId: (state, action) => {
      state.activeDriverId = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAuthInitialized: (state, action) => {
      state.isAuthInitialized = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.currentRole = null;
      state.activeDriverId = null;
    }
  }
});

export const { setRole, setActiveDriverId, setUser, setAuthInitialized, logout } = authSlice.actions;
export default authSlice.reducer;
