import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  Delete,
  Globe,
  KeyRound,
  Loader2,
  Settings,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getDefaultApiUrl } from '../../../constants';
import backgroundL from '../../../assets/login/background_l.jpg';
import backgroundM from '../../../assets/login/background_m.jpg';
import backgroundS from '../../../assets/login/background_s.jpg';
import backgroundXL from '../../../assets/login/background_xl.jpg';
import logoFull from '../../../assets/logo-full.svg';
import useAuthStore from '../../../store/authStore';
import useConfigStore from '../../../store/configStore';

const MAX_PIN_LENGTH = 8;
const MIN_PIN_LENGTH = 4;

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: '/login' });
  const location = useLocation();
  const { loginUser, loginWithPin, loading, error } = useAuthStore();
  const { apiBaseUrl, setApiBaseUrl } = useConfigStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState('pin');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(false);

  const formatUrlForSubmit = (url) => {
    const fallback = getDefaultApiUrl() || 'http://localhost:8080';
    if (!url || url.trim() === '') {
      return fallback;
    }

    let formattedUrl = url.trim().replace(/\/+$/, '');

    if (!/^https?:\/\//i.test(formattedUrl)) {
      if (formattedUrl.includes('localhost') || formattedUrl.includes('127.0.0.1')) {
        formattedUrl = 'http://' + formattedUrl;
      } else {
        formattedUrl = 'https://' + formattedUrl;
      }
    }

    return formattedUrl;
  };

  const redirectAfterLogin = useCallback(() => {
    const redirectTo = new URLSearchParams(location.search).get('redirectTo');
    navigate({ to: redirectTo || '/simple/drinks' });
  }, [location.search, navigate]);

  const submitPin = useCallback(
    async (pinValue) => {
      if (pinValue.length < MIN_PIN_LENGTH || loading) {
        return;
      }

      try {
        const formattedUrl = formatUrlForSubmit(apiBaseUrl);
        setApiBaseUrl(formattedUrl);

        const success = await loginWithPin(
          { pin: pinValue, remember },
          formattedUrl,
        );
        if (success) {
          setPin('');
          redirectAfterLogin();
        } else {
          setPin('');
        }
      } catch (err) {
        console.error('PIN login error:', err);
        setPin('');
      }
    },
    [apiBaseUrl, loading, loginWithPin, redirectAfterLogin, remember, setApiBaseUrl],
  );

  useEffect(() => {
    if (pin.length >= MAX_PIN_LENGTH) {
      submitPin(pin);
    }
  }, [pin, submitPin]);

  const onPasswordSubmit = async (values) => {
    try {
      const formattedUrl = formatUrlForSubmit(apiBaseUrl);
      setApiBaseUrl(formattedUrl);

      const success = await loginUser(values, formattedUrl);
      if (success) {
        redirectAfterLogin();
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handlePinDigit = (digit) => {
    if (loading) return;
    setPin((prev) => {
      if (prev.length >= MAX_PIN_LENGTH) return prev;
      return prev + digit;
    });
  };

  const handlePinDelete = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const getBackgroundImage = () => {
    if (window.innerWidth <= 571) return backgroundS;
    if (window.innerWidth <= 857) return backgroundM;
    if (window.innerWidth <= 1143) return backgroundL;
    return backgroundXL;
  };

  const pinPadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="flex h-screen w-full">
      <div
        className="w-full hidden md:flex bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackgroundImage()})` }}
      />

      <div className="w-full flex flex-col items-center justify-center bg-background p-6">
        <div className="md:w-96 w-80 flex flex-col items-center justify-center">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img
                src={logoFull}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-4xl font-medium">
            {t('login.headline_short') || 'Sign in'}
          </h2>
          <p className="text-sm text-foreground-muted mt-3 text-center">
            {mode === 'pin'
              ? t('login.pin_subtitle', 'Enter your PIN to continue')
              : t('login.subtitle')}
          </p>

          {error && (
            <Alert variant="destructive" className="w-full mt-6">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'pin' ? (
            <div className="w-full mt-8">
              <div className="flex justify-center gap-3 mb-8 min-h-8">
                {Array.from({ length: Math.max(pin.length, MIN_PIN_LENGTH) }).map(
                  (_, index) => (
                    <span
                      key={index}
                      className={`size-3 rounded-full ${
                        index < pin.length
                          ? 'bg-foreground'
                          : 'bg-border-strong'
                      }`}
                    />
                  ),
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {pinPadKeys.map((key, index) => {
                  if (key === '') {
                    return <div key={`spacer-${index}`} />;
                  }
                  if (key === 'del') {
                    return (
                      <Button
                        key="del"
                        type="button"
                        variant="secondary"
                        className="h-16 text-xl"
                        onClick={handlePinDelete}
                        disabled={loading || pin.length === 0}
                        aria-label={t('login.pin_delete', 'Delete')}
                      >
                        <Delete className="size-6" />
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="secondary"
                      className="h-16 text-2xl font-semibold"
                      onClick={() => handlePinDigit(key)}
                      disabled={loading}
                    >
                      {key}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mt-6">
                <Checkbox
                  id="remember-pin"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                />
                <Label
                  htmlFor="remember-pin"
                  className="text-sm cursor-pointer font-normal"
                >
                  {t('login.remember_me')}
                </Label>
              </div>

              <Button
                type="button"
                className="mt-6 w-full"
                disabled={loading || pin.length < MIN_PIN_LENGTH}
                onClick={() => submitPin(pin)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-6 animate-spin" />
                    {t('login.logging_in')}
                  </>
                ) : (
                  t('login.btn_label_short') || t('login.btn_label')
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => {
                  setMode('password');
                  setPin('');
                }}
              >
                {t('login.use_password', 'Use password instead')}
              </Button>
            </div>
          ) : (
            <form
              name="login"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                onPasswordSubmit({
                  username: formData.get('username'),
                  password: formData.get('password'),
                  remember: formData.get('remember') === 'on',
                });
              }}
              className="w-full flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-4 w-full my-8">
                <div className="w-full h-px bg-border"></div>
                <p className="text-nowrap text-sm text-foreground-muted">
                  {t('login.divider_text') || 'sign in with email'}
                </p>
                <div className="w-full h-px bg-border"></div>
              </div>

              <div className="flex items-center w-full bg-surface border-control border-border-strong min-h-control-md rounded-md shadow-inset overflow-hidden pl-4 gap-3">
                <User className="size-6 text-foreground-muted" />
                <input
                  type="text"
                  name="username"
                  placeholder={t('login.username_field_label')}
                  className="bg-transparent placeholder:text-foreground-muted outline-none text-sm w-full h-full pr-6"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  inputMode="email"
                />
              </div>

              <div className="flex items-center mt-6 w-full bg-surface border-control border-border-strong min-h-control-md rounded-md shadow-inset overflow-hidden pl-4 gap-3">
                <KeyRound className="size-6 text-foreground-muted" />
                <input
                  type="password"
                  name="password"
                  placeholder={t('login.password_field_label')}
                  className="bg-transparent placeholder:text-foreground-muted outline-none text-sm w-full h-full pr-6"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="w-full flex items-center mt-8">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember-checkbox" name="remember" />
                  <Label
                    htmlFor="remember-checkbox"
                    className="text-sm cursor-pointer font-normal"
                  >
                    {t('login.remember_me')}
                  </Label>
                </div>
              </div>

              {showAdvanced && (
                <div className="w-full mt-6">
                  <div className="flex items-center w-full bg-surface border-control border-border-strong min-h-control-md rounded-md shadow-inset overflow-hidden pl-4 gap-3">
                    <Globe className="size-6 text-foreground-muted" />
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
                      className="bg-transparent placeholder:text-foreground-muted outline-none text-sm w-full h-full pr-6"
                      autoComplete="url"
                      inputMode="url"
                    />
                  </div>
                  <p className="text-sm text-foreground-muted mt-2 px-1">
                    {t(
                      'login.api_url_help',
                      'Leave blank to use this server. Override only for remote API access.',
                    )}
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
                <Settings className="size-4 mr-1" />
                {showAdvanced
                  ? t('common.hide') || 'Hide'
                  : t('common.show') || 'Show'}{' '}
                {t('login.advanced_settings')}
              </Button>

              <Button type="submit" className="mt-8 w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-6 animate-spin" />
                    {t('login.logging_in')}
                  </>
                ) : (
                  t('login.btn_label_short') || t('login.btn_label')
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => setMode('pin')}
              >
                {t('login.use_pin', 'Use PIN instead')}
              </Button>
            </form>
          )}

          {mode === 'pin' && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-2"
              >
                <Settings className="size-4 mr-1" />
                {showAdvanced
                  ? t('common.hide') || 'Hide'
                  : t('common.show') || 'Show'}{' '}
                {t('login.advanced_settings')}
              </Button>

              {showAdvanced && (
                <div className="w-full mt-4">
                  <div className="flex items-center w-full bg-surface border-control border-border-strong min-h-control-md rounded-md shadow-inset overflow-hidden pl-4 gap-3">
                    <Globe className="size-6 text-foreground-muted" />
                    <input
                      type="url"
                      name="apiBaseUrl"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder={`${t('login.api_url')} (${t('common.optional') || 'optional'})`}
                      className="bg-transparent placeholder:text-foreground-muted outline-none text-sm w-full h-full pr-6"
                      autoComplete="url"
                      inputMode="url"
                    />
                  </div>
                  <p className="text-sm text-foreground-muted mt-2 px-1">
                    {t(
                      'login.api_url_help',
                      'Leave blank to use this server. Override only for remote API access.',
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
