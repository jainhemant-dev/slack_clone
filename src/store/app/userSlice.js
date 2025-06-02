import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '@/lib/client';

// Update user profile
export const updateProfile = createAsyncThunk('user/updateProfile', async (profile, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/api/user', {
      method: 'PATCH',
      body: JSON.stringify(profile),
      credentials: 'include',
    });
    return res.user;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to update profile');
  }
});

// Reset password
export const resetPassword = createAsyncThunk('user/resetPassword', async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/api/user/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.message;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to reset password');
  }
});

// Invite user to channel
export const inviteToChannel = createAsyncThunk('user/inviteToChannel', async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/api/user/invite', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.message;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to invite user');
  }
});

// Remove user from channel
export const removeFromChannel = createAsyncThunk('user/removeFromChannel', async (data, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/api/user/remove-from-channel', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
    });
    return res.message;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to remove user');
  }
});

// Delete user
export const deleteUser = createAsyncThunk('user/deleteUser', async (_, { rejectWithValue }) => {
  try {
    const res = await apiFetch('/api/user', {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.message;
  } catch (err) {
    return rejectWithValue(err.message || 'Failed to delete user');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearUserStatus: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; state.success = 'Profile updated.'; })
      .addCase(updateProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(resetPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resetPassword.fulfilled, (state, action) => { state.loading = false; state.success = action.payload; })
      .addCase(resetPassword.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(inviteToChannel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(inviteToChannel.fulfilled, (state, action) => { state.loading = false; state.success = action.payload; })
      .addCase(inviteToChannel.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(removeFromChannel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(removeFromChannel.fulfilled, (state, action) => { state.loading = false; state.success = action.payload; })
      .addCase(removeFromChannel.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(deleteUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteUser.fulfilled, (state, action) => { state.loading = false; state.success = action.payload; state.profile = null; })
      .addCase(deleteUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const selectUserProfile = (state) => state.user.profile;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectUserSuccess = (state) => state.user.success;

export const { clearUserStatus } = userSlice.actions;
export default userSlice.reducer;
