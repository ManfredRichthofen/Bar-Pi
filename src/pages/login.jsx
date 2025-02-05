import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import logoFull from '../assets/logo-full.svg';
import backgroundS from '../assets/login/background_s.jpg';
import backgroundM from '../assets/login/background_m.jpg';
import backgroundL from '../assets/login/background_l.jpg';
import backgroundXL from '../assets/login/background_xl.jpg';
import { User, KeyRound, ArrowRight } from 'lucide-react';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, loading, error } = useAuthStore();

  const onSubmit = async (values) => {
    const success = await loginUser(values);
    if (success) {
      const redirectTo = new URLSearchParams(location.search).get('redirectTo');
      navigate(redirectTo || '/drinks');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{
        backgroundImage: `url(${
          window.innerWidth <= 571
            ? backgroundS
            : window.innerWidth <= 857
              ? backgroundM
              : window.innerWidth <= 1143
                ? backgroundL
                : backgroundXL
        })`,
      }}
    >
      <div className="card w-full max-w-md bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="text-center mb-8">
            <img
              src={logoFull}
              alt="Logo"
              className="mx-auto mb-6 w-24 sm:w-28 lg:w-32"
            />
            <h2 className="text-2xl font-bold mb-2">{t('login_headline')}</h2>
            <p>{t('login_subtitle') || 'Please sign in to your account'}</p>
          </div>

          {/* Display error message if login fails */}
          {error && (
            <div className="alert alert-error mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form - Replace Form with regular form element */}
          <form
            name="login"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              onSubmit({
                username: formData.get('username'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on',
              });
            }}
            className="space-y-4"
          >
            <div className="form-control w-full">
              <div className="input-group">
                <span>
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  name="username"
                  placeholder={t('login_username_field_label')}
                  className="input input-bordered w-full"
                  required
                />
              </div>
            </div>

            <div className="form-control w-full">
              <div className="input-group">
                <span>
                  <KeyRound className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder={t('login_password_field_label')}
                  className="input input-bordered w-full"
                  required
                />
              </div>
            </div>

            {/* Remember Me and Forgot Password  TODO Actually make work */}
            <div className="flex justify-between items-center">
              <label className="label cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  className="checkbox checkbox-sm"
                />
                <span className="label-text ml-2">
                  {t('login_remember_me') || 'Remember me'}
                </span>
              </label>

              <a href="/forgot-password" className="link">
                {t('login_forgot_password') || 'Forgot your password?'}
              </a>
            </div>

            {/* Submit Button TODO fix loading style see https://v5.daisyui.com/components/button/#button-with-loading-spinner */}
            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {!loading && <ArrowRight className="w-5 h-5" />}
              {loading
                ? t('login_logging_in') || 'Signing you in...'
                : t('login_btn_label') || 'Sign in to your account'}
            </button>

            {/* Sign Up Link TODO */}
            <div className="text-center mt-6">
              <p>
                {t('login_no_account') || "Don't have an account?"}{' '}
                <a href="/register" className="link">
                  {t('login_create_account') || 'Create one here'}
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
