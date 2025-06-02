import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Mock users array for development (in production, this would be a database)
const mockUsers = []
const mockWorkspaces = []

// Async thunks for authentication
export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Login failed")
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    return rejectWithValue(error.message || "Login failed")
  }
})

export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Registration failed")
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    return rejectWithValue(error.message || "Registration failed")
  }
})

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/auth/me")

    if (!response.ok) {
      if (response.status === 401) {
        return null // Not authenticated, but not an error
      }
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Failed to fetch user")
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    return rejectWithValue(error.message || "Failed to fetch user")
  }
})

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    })

    if (!response.ok) {
      const errorData = await response.json()
      return rejectWithValue(errorData.message || "Logout failed")
    }

    return null
  } catch (error) {
    return rejectWithValue(error.message || "Logout failed")
  }
})

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  workspaces: [],
  currentWorkspace: null,
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload
    },
    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload)
    },
    updateWorkspace: (state, action) => {
      const index = state.workspaces.findIndex((w) => w.id === action.payload.id)
      if (index !== -1) {
        state.workspaces[index] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.workspaces = action.payload.workspaces || []
        state.currentWorkspace = action.payload.workspaces?.[0] || null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Login failed"
        state.isAuthenticated = false
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.workspaces = action.payload.workspaces || []
        state.currentWorkspace = action.payload.workspaces?.[0] || null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Registration failed"
        state.isAuthenticated = false
      })

      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
          state.workspaces = action.payload.workspaces || []
          state.currentWorkspace = action.payload.workspaces?.[0] || null
        } else {
          state.user = null
          state.isAuthenticated = false
          state.workspaces = []
          state.currentWorkspace = null
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Failed to fetch user"
        state.user = null
        state.isAuthenticated = false
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.loading = false
        state.workspaces = []
        state.currentWorkspace = null
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Logout failed"
      })
  },
})

export const { clearError, setCurrentWorkspace, addWorkspace, updateWorkspace } = authSlice.actions

export default authSlice.reducer
