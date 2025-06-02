import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  activeChannel: "cohort-1",
  activeDM: null,
  sidebarOpen: true,
  mobileSidebarOpen: false,
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveChannel: (state, action) => {
      state.activeChannel = action.payload
    },
    setActiveDM: (state, action) => {
      state.activeDM = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
  },
})

export const { setActiveChannel, setActiveDM, toggleSidebar, toggleMobileSidebar } = uiSlice.actions

export default uiSlice.reducer
