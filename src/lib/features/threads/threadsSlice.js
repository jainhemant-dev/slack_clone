import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Async thunks for thread operations
export const fetchThreadMessages = createAsyncThunk("threads/fetchMessages", async (threadId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/threads/${threadId}`)

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to fetch thread messages")
    }

    const data = await response.json()
    return { threadId, messages: data.messages }
  } catch (error) {
    return rejectWithValue(error.message || "Failed to fetch thread messages")
  }
})

export const addThreadComment = createAsyncThunk(
  "threads/addComment",
  async ({ threadId, comment }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || "Failed to add comment")
      }

      const data = await response.json()
      return { threadId, comment: data.comment }
    } catch (error) {
      return rejectWithValue(error.message || "Failed to add comment")
    }
  },
)

const initialState = {
  activeThreadId: null,
  threads: {}, // Map of threadId -> { messages: [] }
  loading: false,
  error: null,
}

export const threadsSlice = createSlice({
  name: "threads",
  initialState,
  reducers: {
    setActiveThread: (state, action) => {
      state.activeThreadId = action.payload
    },
    clearActiveThread: (state) => {
      state.activeThreadId = null
    },
    addLocalThreadComment: (state, action) => {
      const { threadId, comment } = action.payload
      if (!state.threads[threadId]) {
        state.threads[threadId] = { messages: [] }
      }
      state.threads[threadId].messages.push(comment)
    },
    clearThreadError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch thread messages
      .addCase(fetchThreadMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        state.loading = false
        const { threadId, messages } = action.payload
        state.threads[threadId] = { messages }
      })
      .addCase(fetchThreadMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to fetch thread messages"
      })

      // Add thread comment
      .addCase(addThreadComment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addThreadComment.fulfilled, (state, action) => {
        state.loading = false
        const { threadId, comment } = action.payload
        if (!state.threads[threadId]) {
          state.threads[threadId] = { messages: [] }
        }
        state.threads[threadId].messages.push(comment)
      })
      .addCase(addThreadComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to add comment"
      })
  },
})

export const { setActiveThread, clearActiveThread, addLocalThreadComment, clearThreadError } = threadsSlice.actions

export default threadsSlice.reducer
