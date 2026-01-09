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
import { User, KeyRound, Globe, Settings, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
      <div className="w-full flex flex-col items-center justify-center bg-background p-6">
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
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img
                src={logoFull}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Header */}
          <h2 className="text-4xl font-medium">
            {t('login.headline_short') || 'Sign in'}
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            {t('login.subtitle')}
          </p>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="w-full mt-6">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 w-full my-8">
            <div className="w-full h-px bg-border"></div>
            <p className="text-nowrap text-sm text-muted-foreground">
              {t('login.divider_text') || 'sign in with email'}
            </p>
            <div className="w-full h-px bg-border"></div>
          </div>

          {/* Username Input */}
          <div className="flex items-center w-full bg-transparent border h-12 rounded-full overflow-hidden pl-6 gap-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
            <User className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="username"
              placeholder={t('login.username_field_label')}
              className="bg-transparent placeholder:text-muted-foreground outline-none text-sm w-full h-full pr-6"
              required
              autoComplete="username"
              autoCapitalize="none"
              inputMode="email"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center mt-6 w-full bg-transparent border h-12 rounded-full overflow-hidden pl-6 gap-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              name="password"
              placeholder={t('login.password_field_label')}
              className="bg-transparent placeholder:text-muted-foreground outline-none text-sm w-full h-full pr-6"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="w-full flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              <Checkbox id="remember-checkbox" name="remember" />
              <Label
                htmlFor="remember-checkbox"
                className="text-sm cursor-pointer font-normal"
              >
                {t('login.remember_me')}
              </Label>
            </div>
            <a
              className="text-sm hover:underline text-muted-foreground"
              href="/forgot-password"
            >
              {t('login.forgot_password')}
            </a>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="w-full mt-6">
              <div className="flex items-center w-full bg-transparent border h-12 rounded-full overflow-hidden pl-6 gap-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <Globe className="w-4 h-4 text-muted-foreground" />
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
                  className="bg-transparent placeholder:text-muted-foreground outline-none text-sm w-full h-full pr-6"
                  autoComplete="url"
                  inputMode="url"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 px-6">
                {t('login.api_url_help')}
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-4"
          >
            <Settings className="w-3 h-3 mr-1" />
            {showAdvanced
              ? t('common.hide') || 'Hide'
              : t('common.show') || 'Show'}{' '}
            {t('login.advanced_settings')}
          </Button>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="mt-8 w-full h-11 rounded-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('login.logging_in')}
              </>
            ) : (
              t('login.btn_label_short') || t('login.btn_label')
            )}
          </Button>

          {/* Sign Up Link */}
          <p className="text-muted-foreground text-sm mt-4">
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
