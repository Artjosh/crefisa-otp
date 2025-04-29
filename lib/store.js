"use client"

import { create } from "zustand"

export const useStore = create((set, get) => ({
  otpItems: [],
  isLoading: false,
  error: null,
  selectedItems: [],
  isSelectionMode: false,

  // Toggle selection mode
  toggleSelectionMode: () => {
    set((state) => ({ 
      isSelectionMode: !state.isSelectionMode,
      selectedItems: [] // Reset selections when toggling mode
    }))
  },

  // Toggle item selection
  toggleItemSelection: (id) => {
    set((state) => {
      if (state.selectedItems.includes(id)) {
        return { selectedItems: state.selectedItems.filter(itemId => itemId !== id) }
      } else {
        return { selectedItems: [...state.selectedItems, id] }
      }
    })
  },

  // Clear all selections
  clearSelections: () => {
    set({ selectedItems: [] })
  },

  // Delete multiple OTP items at once
  bulkDeleteItems: async () => {
    const { selectedItems } = get()
    if (selectedItems.length === 0) return

    set({ isLoading: true, error: null })

    try {
      // Delete each selected item one by one
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/otp/${id}`, { method: "DELETE" })
      )
      
      await Promise.all(deletePromises)

      // Update the local state
      set((state) => ({
        otpItems: state.otpItems.filter(item => !state.selectedItems.includes(item.id)),
        selectedItems: [],
        isSelectionMode: false,
        isLoading: false
      }))

      return true
    } catch (error) {
      console.error("Error bulk deleting OTP items:", error)
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  // Load OTP items from the API
  loadOtpItems: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch("/api/otp")

      if (!response.ok) {
        throw new Error("Failed to fetch OTP items")
      }

      const data = await response.json()
      set({ otpItems: data.items || [], isLoading: false })
    } catch (error) {
      console.error("Error loading OTP items:", error)
      set({ error: error.message, isLoading: false })
    }
  },

  // Update an OTP item via API
  updateOtpItem: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/otp/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update OTP item")
      }

      const updatedItem = await response.json()

      set((state) => ({
        otpItems: state.otpItems.map((item) => 
          item.id === id ? { ...item, ...updatedItem } : item
        ),
        isLoading: false,
      }))

      return updatedItem
    } catch (error) {
      console.error("Error updating OTP item:", error)
      set({ error: error.message, isLoading: false })
      return null
    }
  },

  // Remove an OTP item via API
  removeOtpItem: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/otp/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete OTP item")
      }

      set((state) => ({
        otpItems: state.otpItems.filter((item) => item.id !== id),
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error("Error removing OTP item:", error)
      set({ error: error.message, isLoading: false })
      return false
    }
  },
}))
