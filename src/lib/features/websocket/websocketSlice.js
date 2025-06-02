import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  connected: false,
  connecting: false,
  error: null,
  reconnectAttempts: 0,
  lastPing: null,
}

export const websocketSlice = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    connecting: (state) => {
      state.connecting = true
      state.error = null
    },
    connected: (state) => {
      state.connected = true
      state.connecting = false
      state.error = null
      state.reconnectAttempts = 0
      state.lastPing = Date.now()
    },
    disconnected: (state) => {
      state.connected = false
      state.connecting = false
    },
    connectionError: (state, action) => {
      state.connected = false
      state.connecting = false
      state.error = action.payload
      state.reconnectAttempts += 1
    },
    pingReceived: (state) => {
      state.lastPing = Date.now()
    },
  },
})

export const { connecting, connected, disconnected, connectionError, pingReceived } = websocketSlice.actions

export default websocketSlice.reducer
