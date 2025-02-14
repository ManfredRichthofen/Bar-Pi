import { Link } from '@tanstack/react-router'
import useUIModeStore from '../store/uiModeStore'
import useAuthStore from '../store/authStore'

export default function NotFound() {
  const isAdvancedMode = useUIModeStore((state) => state.isAdvancedMode)
  const token = useAuthStore((state) => state.token)

  const homePath = token
    ? isAdvancedMode
      ? '/advanced/drinks'
      : '/simple/drinks'
    : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-8 text-2xl font-semibold text-base-content">
          Page Not Found
        </h2>
        <p className="mb-8 text-base-content/80">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={homePath}
          className="btn btn-primary"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
} 