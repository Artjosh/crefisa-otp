"use client"

import { create } from "zustand"

// Variável para controlar o último tempo de chamada (fora do estado do zustand)
let lastFetchTime = 0;

export const useStore = create((set, get) => ({
  otpItems: [],
  isLoading: false,
  error: null,
  selectedItems: [],
  isSelectionMode: false,

  // Função auxiliar para adicionar o token de autenticação
  getAuthHeaders: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  },

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
    const { selectedItems, getAuthHeaders } = get()
    if (selectedItems.length === 0) return

    set({ isLoading: true, error: null })

    try {
      const authHeaders = getAuthHeaders()
      
      // Delete each selected item one by one
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/otp/${id}/`, {
          method: "DELETE",
          headers: authHeaders
        })
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
  loadOtpItems: async (forceRefresh = false) => {
    const now = Date.now();
    
    // Prevenir múltiplas chamadas em curto período (debounce de 2 segundos)
    // A menos que seja uma atualização forçada
    if (!forceRefresh && now - lastFetchTime < 2000) {
      console.log("OTP Store - Ignorando requisição duplicada (tempo mínimo não atingido)");
      return;
    }
    
    // Se já estiver carregando, não tente novamente
    if (get().isLoading && !forceRefresh) {
      console.log("OTP Store - Já está carregando, ignorando requisição duplicada");
      return;
    }
    
    console.log("OTP Store - Iniciando carregamento de dados, forceRefresh:", forceRefresh);
    lastFetchTime = now;
    set({ isLoading: true, error: null });

    try {
      const authHeaders = get().getAuthHeaders();
      if (!authHeaders['Authorization']) {
        console.error("OTP Store - Token não encontrado");
        throw new Error("Autenticação necessária");
      }
      
      console.log("OTP Store - Enviando requisição para /api/otp");
      const response = await fetch("/api/otp/", {
        headers: authHeaders
      });

      if (!response.ok) {
        console.error("OTP Store - Erro na resposta:", response.status);
        throw new Error(`Erro ao buscar itens: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.items)) {
        console.error("OTP Store - Formato de resposta inválido:", data);
        throw new Error("Resposta inválida do servidor");
      }
      
      console.log("OTP Store - Dados recebidos com sucesso:", data.items.length, "itens");
      set({ otpItems: data.items, isLoading: false });
    } catch (error) {
      console.error("OTP Store - Erro ao carregar itens:", error.message);
      set({ 
        error: `Falha ao carregar itens: ${error.message || "Erro desconhecido"}`, 
        isLoading: false 
      });
    }
  },

  // Update an OTP item via API
  updateOtpItem: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      const authHeaders = get().getAuthHeaders()
      
      const response = await fetch(`/api/otp/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
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
      const authHeaders = get().getAuthHeaders()
      
      const response = await fetch(`/api/otp/${id}/`, {
        method: "DELETE",
        headers: authHeaders
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
