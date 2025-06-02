import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '@/lib/client';

// Fetch channels user is subscribed to
export const fetchMyChannels = createAsyncThunk(
    'channels/fetchMyChannels',
    async (_, { rejectWithValue }) => {
        try {
            const data = await apiFetch('/api/channel/:id', { credentials: 'include' });
            return data;
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to fetch channels');
        }
    }
);

// Create a new channel
export const createChannel = createAsyncThunk(
    'channels/createChannel',
    async (channelData, { rejectWithValue }) => {
        try {
            const data = await apiFetch(`/api/channels/workspace/${channelData.workspaceId}`, {
                method: 'POST',
                body: JSON.stringify(channelData),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to create channel');
        }
    }
);

const channelSlice = createSlice({
    name: 'channels',
    initialState: {
        channels: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyChannels.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyChannels.fulfilled, (state, action) => {
                state.loading = false;
                state.channels = action.payload;
            })
            .addCase(fetchMyChannels.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createChannel.fulfilled, (state, action) => {
                console.log('Channel created:', action.payload);
                state.channels.push(action.payload);
            });
    },
});

export const selectChannels = (state) => state.channels.channels;
export const selectChannelsLoading = (state) => state.channels.loading;
export const selectChannelsError = (state) => state.channels.error;

export default channelSlice.reducer;