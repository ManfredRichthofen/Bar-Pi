import { Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useUIModeStore from '../store/uiModeStore'
import { themeChange } from 'theme-change'
import { useTranslation } from 'react-i18next'

export default function Root() {
  const reinitializeAuthState = useAuthStore((state) => state.reinitializeAuthState)
  const { i18n } = useTranslation()
  const { isInitialized: isUIModeInitialized } = useUIModeStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize auth state
        reinitializeAuthState()

        // Theme initialization
        const savedTheme = localStorage.getItem('theme') || 'light'
        document.documentElement.setAttribute('data-theme', savedTheme)
        themeChange(false)

        // Language initialization
        const savedLanguage = localStorage.getItem('i18nextLng') || 'en'
        await i18n.changeLanguage(savedLanguage)

        setIsInitialized(true)
      } catch (error) {
        console.error('Initialization error:', error)
        setIsInitialized(true) // Still set initialized to prevent infinite loading
      }
    }

    initialize()

    // Theme observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme')
          if (newTheme) {
            localStorage.setItem('theme', newTheme)
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [reinitializeAuthState, i18n])

  if (!isInitialized || !isUIModeInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return <Outlet />
} 