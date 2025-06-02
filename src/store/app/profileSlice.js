import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '@/lib/client';

// Async thunk to fetch current user (me)
export const fetchMe = createAsyncThunk('profile/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const data = await apiFetch('/api/auth/me', { credentials: 'include' });
    return data.user;
  } catch (err) {
    return rejectWithValue(err.message || 'Not authenticated');
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    me: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    selectedWorkspace: null,
    selectedChannel: null,
  },
  reducers: {
    setMe: (state, action) => {
      state.me = action.payload;
      state.isAuthenticated = !!action.payload;
      // Set default workspace and channel if available
      if (action.payload && action.payload.workspaces?.length > 0) {
        state.selectedWorkspace = action.payload.workspaces[0];
        state.selectedChannel = action.payload.workspaces[0].channels?.[0] || null;
      } else {
        state.selectedWorkspace = null;
        state.selectedChannel = null;
      }
    },
    selectWorkspace: (state, action) => {
      const workspace = state.me?.workspaces?.find(w => w.id === action.payload);
      state.selectedWorkspace = workspace || null;
      // Set default channel for new workspace
      state.selectedChannel = workspace?.channels?.[0] || null;
    },
    selectChannel: (state, action) => {
      if (state.selectedWorkspace) {
        const channel = state.selectedWorkspace.channels?.find(c => c.id === action.payload);
        state.selectedChannel = channel || null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        console.log(action.payload, 'action.payload');
        
        state.loading = false;
        state.me = action.payload;
        state.isAuthenticated = !!action.payload;
        // Set default workspace and channel if available
        if (action.payload && action.payload.workspaces?.length > 0) {
          state.selectedWorkspace = action.payload.workspaces[0];
          state.selectedChannel = action.payload.workspaces[0].channels?.[0] || null;
        } else {
          state.selectedWorkspace = null;
          state.selectedChannel = null;
        }
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.me = null;
        state.isAuthenticated = false;
        state.selectedWorkspace = null;
        state.selectedChannel = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectMe = (state) => state.profile.me;
export const selectMeLoading = (state) => state.profile.loading;
export const selectMeError = (state) => state.profile.error;
export const selectIsAuthenticated = (state) => state.profile.isAuthenticated;
export const selectSelectedWorkspace = (state) => state.profile.selectedWorkspace;
export const selectSelectedChannel = (state) => state.profile.selectedChannel;

// Export actions
export const { setMe, selectWorkspace, selectChannel } = profileSlice.actions;

export default profileSlice.reducer;