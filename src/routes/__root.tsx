import { Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useUIModeStore from '../store/uiModeStore'
import { themeChange } from 'theme-change'
import { useTranslation } from 'react-i18next'

export default function Root() {
  const reinitializeAuthState = useAuthStore((state) => state.reinitializeAuthState)
  const setInitialized = useUIModeStore((state) => state.setInitialized)
  const { i18n } = useTranslation()
  const { isInitialized: isUIModeInitialized } = useUIModeStore()
  const [isLocalInitialized, setIsLocalInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        // Initialize auth state first and wait for it
        await reinitializeAuthState()

        // Theme initialization
        const savedTheme = localStorage.getItem('theme') || 'light'
        document.documentElement.setAttribute('data-theme', savedTheme)
        themeChange(false)

        // Language initialization
        const savedLanguage = localStorage.getItem('i18nextLng') || 'en'
        await i18n.changeLanguage(savedLanguage)

        if (mounted) {
          setIsLocalInitialized(true)
          setInitialized(true) // Set UI mode store as initialized
        }
      } catch (err) {
        console.error('Initialization error:', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize app'))
          setIsLocalInitialized(true)
          setInitialized(true) // Still set initialized to prevent infinite loading
        }
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

    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [reinitializeAuthState, i18n, setInitialized])

  if (!isLocalInitialized || !isUIModeInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="alert alert-error">
          <span>Failed to initialize app: {error.message}</span>
        </div>
      </div>
    )
  }

  return <Outlet />
} 