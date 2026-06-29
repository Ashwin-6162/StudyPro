import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (theme) => {
  // theme: 'dark' | 'light' | 'system'
  let effective = theme;
  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (effective === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

const applyFontSize = (size) => {
  // size: 'sm' | 'md' | 'lg' — scales the root font size
  const scale = { sm: '14px', md: '16px', lg: '18px' }[size] || '16px';
  document.documentElement.style.fontSize = scale;
};

const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      token: null,
      isAuthenticated: false,
      login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      // Update individual user fields (e.g. profile photo, name)
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : updates
      })),

      // Theme State
      theme: 'dark', // 'dark' | 'light' | 'system'
      setTheme: (theme) => { applyTheme(theme); set({ theme }); },
      toggleTheme: () => {
        const current = get().theme;
        // Resolve current effective theme, then flip to the opposite explicit theme
        let effectiveDark = current === 'dark';
        if (current === 'system') {
          effectiveDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        const next = effectiveDark ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },

      // Preferences State
      fontSize: 'md',          // 'sm' | 'md' | 'lg'
      language: 'en',          // 'en' | 'uk' | 'ta'
      aiModel: 'gemini',       // 'gemini' | 'grok'
      answerLength: 'detailed',// 'concise' | 'detailed'
      citationStyle: 'inline', // 'inline' | 'apa' | 'hidden'
      setFontSize: (size) => { applyFontSize(size); set({ fontSize: size }); },
      setLanguage: (language) => set({ language }),
      setAiModel: (aiModel) => set({ aiModel }),
      setAnswerLength: (answerLength) => set({ answerLength }),
      setCitationStyle: (citationStyle) => set({ citationStyle }),

      // Notification Preferences
      notifications: { email: true, browser: false, mobile: true, updates: true },
      setNotification: (key, value) => set((state) => ({
        notifications: { ...state.notifications, [key]: value }
      })),

      // App State
      activeDocument: null,
      setActiveDocument: (doc) => set((state) => {
        if (state.activeDocument?.id !== doc?.id) {
          return { activeDocument: doc, messages: [] };
        }
        return { activeDocument: doc };
      }),
      clearActiveDocument: () => set({ activeDocument: null }),
      messages: [],
      setMessages: (updater) => set((state) => ({ 
        messages: typeof updater === 'function' ? updater(state.messages) : updater 
      })),
      clearMessages: () => set({ messages: [] })
    }),
    {
      name: 'examgpt-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        fontSize: state.fontSize,
        language: state.language,
        aiModel: state.aiModel,
        answerLength: state.answerLength,
        citationStyle: state.citationStyle,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-apply saved theme and font size on page load
        if (state?.theme) applyTheme(state.theme);
        if (state?.fontSize) applyFontSize(state.fontSize);
      },
    }
  )
);

export default useStore;
