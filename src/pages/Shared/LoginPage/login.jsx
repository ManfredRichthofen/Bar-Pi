import { useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../../store/authStore';
import useConfigStore from '../../../store/configStore';
import logoFull from '../../../assets/logo-full.svg';
import backgroundS from '../../../assets/login/background_s.jpg';
import backgroundM from '../../../assets/login/background_m.jpg';
import backgroundL from '../../../assets/login/background_l.jpg';
import backgroundXL from '../../../assets/login/background_xl.jpg';
import { User, KeyRound, Globe, XCircle, Settings } from 'lucide-react';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, loading, error } = useAuthStore();
  const { apiBaseUrl, setApiBaseUrl } = useConfigStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatUrl = (url) => {
    const trimmedUrl = url.trim();
    return trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
  };

  const onSubmit = async (values) => {
    const currentApiUrl = apiBaseUrl.trim();

    try {
      // Format and save the API URL first
      const formattedUrl = formatUrl(currentApiUrl);
      if (formattedUrl) {
        setApiBaseUrl(formattedUrl);
      }

      // Use the formatted URL for login
      const success = await loginUser(values, formattedUrl);
      if (success) {
        const redirectTo = new URLSearchParams(location.search).get(
          'redirectTo',
        );
        navigate({ to: redirectTo || '/simple/drinks' });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const getBackgroundImage = () => {
    if (window.innerWidth <= 571) return backgroundS;
    if (window.innerWidth <= 857) return backgroundM;
    if (window.innerWidth <= 1143) return backgroundL;
    return backgroundXL;
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Background Image (Hidden on Mobile) */}
      <div
        className="w-full hidden md:flex bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackgroundImage()})` }}
      />

      {/* Right Side - Login Form */}
      <div className="w-full flex flex-col items-center justify-center bg-base-100 p-6">
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
          className="md:w-96 w-80 flex flex-col items-center justify-center"
        >
          {/* Logo */}
          <div className="avatar mb-6">
            <div className="w-16 rounded-full">
              <img src={logoFull} alt="Logo" />
            </div>
          </div>

          {/* Header */}
          <h2 className="text-4xl text-base-content font-medium">
            {t('login.headline_short') || 'Sign in'}
          </h2>
          <p className="text-sm text-base-content/60 mt-3">
            {t('login.subtitle')}
          </p>

          {/* Error Alert */}
          {error && (
            <div role="alert" className="alert alert-error w-full mt-6 text-sm">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 w-full my-8">
            <div className="w-full h-px bg-base-300"></div>
            <p className="text-nowrap text-sm text-base-content/60">
              {t('login.divider_text') || 'sign in with email'}
            </p>
            <div className="w-full h-px bg-base-300"></div>
          </div>

          {/* Username Input */}
          <div className="flex items-center w-full bg-transparent border border-base-300 h-12 rounded-full overflow-hidden pl-6 gap-3 focus-within:border-primary transition-colors">
            <User className="w-4 h-4 opacity-60" />
            <input
              type="text"
              name="username"
              placeholder={t('login.username_field_label')}
              className="bg-transparent text-base-content placeholder:text-base-content/50 outline-none text-sm w-full h-full pr-6"
              required
              autoComplete="username"
              autoCapitalize="none"
              inputMode="email"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center mt-6 w-full bg-transparent border border-base-300 h-12 rounded-full overflow-hidden pl-6 gap-3 focus-within:border-primary transition-colors">
            <KeyRound className="w-4 h-4 opacity-60" />
            <input
              type="password"
              name="password"
              placeholder={t('login.password_field_label')}
              className="bg-transparent text-base-content placeholder:text-base-content/50 outline-none text-sm w-full h-full pr-6"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="w-full flex items-center justify-between mt-8 text-base-content/70">
            <div className="flex items-center gap-2">
              <input
                className="checkbox checkbox-sm"
                type="checkbox"
                name="remember"
                id="remember-checkbox"
              />
              <label
                className="text-sm cursor-pointer"
                htmlFor="remember-checkbox"
              >
                {t('login.remember_me')}
              </label>
            </div>
            <a className="text-sm hover:underline" href="/forgot-password">
              {t('login.forgot_password')}
            </a>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="w-full mt-6">
              <div className="flex items-center w-full bg-transparent border border-base-300 h-12 rounded-full overflow-hidden pl-6 gap-3 focus-within:border-primary transition-colors">
                <Globe className="w-4 h-4 opacity-60" />
                <input
                  type="url"
                  name="apiBaseUrl"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                      e.stopPropagation();
                    }
                  }}
                  placeholder={`${t('login.api_url')} (${t('common.optional') || 'optional'})`}
                  className="bg-transparent text-base-content placeholder:text-base-content/50 outline-none text-sm w-full h-full pr-6"
                  autoComplete="url"
                  inputMode="url"
                />
              </div>
              <p className="text-xs text-base-content/50 mt-2 px-6">
                {t('login.api_url_help')}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-base-content/60 hover:text-base-content mt-4 flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            {showAdvanced
              ? t('common.hide') || 'Hide'
              : t('common.show') || 'Show'}{' '}
            {t('login.advanced_settings')}
          </button>

          {/* Sign In Button */}
          <button
            type="submit"
            className="mt-8 w-full h-11 rounded-full text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t('login.logging_in')}
              </>
            ) : (
              t('login.btn_label_short') || t('login.btn_label')
            )}
          </button>

          {/* Sign Up Link */}
          <p className="text-base-content/60 text-sm mt-4">
            {t('login.no_account')}{' '}
            <a className="text-primary hover:underline" href="/register">
              {t('login.create_account_short') || t('login.create_account')}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
