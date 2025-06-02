import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/client";

// Fetch all messages for a channel or DM (by key)
export const fetchMessagesByChannel = createAsyncThunk(
  "messages/fetchByChannel",
  async ({ channelId, workspaceId, thread }, thunkAPI) => {
    // key: channelId, userId, or messageId (for threads)
    // isThread: true if fetching thread messages
    const threadPath = thread ? `?thread=${thread}` : "";
    const url = `/api/messages/workspace/${workspaceId}/${channelId}/${threadPath}`;
    const data = await apiFetch(url);
    return { channelId, messages: data.messages || [], thread };
  }
);

// Create a new message
export const createMessage = createAsyncThunk(
  "messages/create",
  async ({ channelId, messagebody,workspaceId, thread }, thunkAPI) => {
    const url = `/api/messages/workspace/${workspaceId}/${channelId}/?channelId=${channelId}`;
    const data = await apiFetch(url, {
      method: "POST",
      body: JSON.stringify(messagebody),
    });
    return { channelId, message: data.message, thread };
  }
);

// Update a message
export const updateMessage = createAsyncThunk(
  "messages/update",
  async ({ channelId, messageId, updates, isThread = false }, thunkAPI) => {
    const url = isThread
      ? `/api/messages/thread/${channelId}/${messageId}`
      : `/api/messages/${channelId}/${messageId}`;
    const data = await apiFetch(url, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return { channelId, message: data.message, isThread };
  }
);

// Delete a message
export const deleteMessage = createAsyncThunk(
  "messages/delete",
  async ({ channelId, messageId, isThread = false }, thunkAPI) => {
    const url = isThread
      ? `/api/messages/thread/${channelId}/${messageId}`
      : `/api/messages/${channelId}/${messageId}`;
    await apiFetch(url, { method: "DELETE" });
    return { channelId, messageId, isThread };
  }
);

const initialState = {
  // channelId/userId/messageId: [messages]
  messages: {},
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    clearMessages(state) {
      state.messages = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessagesByChannel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessagesByChannel.fulfilled, (state, action) => {
        const { channelId, messages, thread } = action.payload;
        state.loading = false;
        state.error = null;
        if(thread){
          state.messages[thread] = messages;
        }else {
          state.messages[channelId] = messages;
        }
      })
      .addCase(fetchMessagesByChannel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create message
      .addCase(createMessage.fulfilled, (state, action) => {
        const { channelId, message, thread } = action.payload;
        
       
        if(thread){
          if (!state.messages[thread]) state.messages[thread] = [];
          state.messages[thread].push(message);
        }else {
          if (!state.messages[channelId]) state.messages[channelId] = [];
          state.messages[channelId].push(message);
        }
      })
      // Update message
      .addCase(updateMessage.fulfilled, (state, action) => {
        const { channelId, message } = action.payload;
        if (state.messages[channelId]) {
          const idx = state.messages[channelId].findIndex((m) => m.id === message.id);
          if (idx !== -1) state.messages[channelId][idx] = message;
        }
      })
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { key, messageId } = action.payload;
        if (state.messages[key]) {
          state.messages[key] = state.messages[key].filter((m) => m.id !== messageId);
        }
      });
  },
});

export const { clearMessages } = messageSlice.actions;
export default messageSlice.reducer;

// Selector to get messages by key (channelId/userId/messageId)
export const selectMessagesByKey = (state, key) => {
  return state.messages.messages[key] || [] ;
};