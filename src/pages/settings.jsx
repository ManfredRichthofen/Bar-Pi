import React, { useEffect, useState } from 'react';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useConfigStore from '../store/configStore';
import useAuthStore from '../store/authStore';
import { Save, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { apiBaseUrl, setApiBaseUrl } = useConfigStore();
  const { logoutUser } = useAuthStore();
  const [tempApiUrl, setTempApiUrl] = useState(apiBaseUrl);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    themeChange(false);
  }, []);

  const themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave',
    'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua',
    'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk',
    'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim',
    'nord', 'sunset'
  ];

  const languages = [
    { code: 'en-US', name: t('languages.english', 'English') },
    { code: 'es', name: t('languages.spanish', 'Español') },
    { code: 'fr', name: t('languages.french', 'Français') },
    { code: 'de', name: t('languages.german', 'Deutsch') },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const testApiConnection = async (url) => {
    try {
      const response = await fetch(`${url}/health`);
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveApiUrl = async () => {
    setError('');

    if (!validateUrl(tempApiUrl)) {
      setError(t('settings.invalid_url'));
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    try {
      const isConnected = await testApiConnection(tempApiUrl);
      
      if (!isConnected) {
        setError(t('settings.api_unreachable'));
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 2000);
        await logoutUser();
        navigate('/login');
        return;
      }

      setApiBaseUrl(tempApiUrl);
      setSaveStatus('success');
      setError('');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Failed to save API URL:', error);
      setError(t('settings.save_error'));
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      await logoutUser();
      navigate('/login');
    }
  };

  const renderGeneralSettings = () => (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl mb-4 sm:mb-6">
          {t('settings.general.title')}
        </h2>

        <div className="space-y-4 sm:space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                {t('settings.general.language_label')}
              </span>
            </label>
            <select
              className="select select-bordered w-full text-sm sm:text-base"
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <label className="label cursor-pointer justify-between py-2">
              <span className="label-text text-sm sm:text-base mr-4">
                {t('settings.general.notifications')}
              </span>
              <input type="checkbox" className="toggle toggle-primary toggle-sm sm:toggle-md" />
            </label>

            <label className="label cursor-pointer justify-between py-2">
              <span className="label-text text-sm sm:text-base mr-4">
                {t('settings.general.sound_effects')}
              </span>
              <input type="checkbox" className="toggle toggle-primary toggle-sm sm:toggle-md" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl mb-4 sm:mb-6">
          {t('settings.advanced.title')}
        </h2>

        <div className="space-y-4 sm:space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                {t('settings.advanced.api_url_label')}
              </span>
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempApiUrl}
                  onChange={(e) => {
                    setTempApiUrl(e.target.value);
                    setError('');
                  }}
                  className={`input input-bordered flex-1 text-sm sm:text-base ${
                    error ? 'input-error' : ''
                  }`}
                  placeholder={t('settings.advanced.api_url_placeholder')}
                />
                <button
                  onClick={handleSaveApiUrl}
                  className={`btn ${saveStatus === 'success' ? 'btn-success' : ''} ${
                    saveStatus === 'error' ? 'btn-error' : ''
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === 'success' && t('settings.advanced.saved')}
                  {saveStatus === 'error' && t('settings.advanced.error')}
                  {!saveStatus && t('settings.advanced.save')}
                </button>
              </div>
              {error && (
                <div className="alert alert-error py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl mb-4 sm:mb-6">
          {t('settings.appearance.title')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {themes.map((theme) => (
            <button
              key={theme}
              data-set-theme={theme}
              data-act-class="active"
              className="theme-controller btn btn-sm h-auto py-2 normal-case hover:btn-primary text-xs sm:text-sm"
            >
              {t(`settings.appearance.themes.${theme}`, theme)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 max-w-4xl mx-auto pt-20 sm:pt-24">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">
        {t('settings.title')}
      </h1>

      <div className="space-y-4 sm:space-y-6">
        {renderGeneralSettings()}
        {renderAdvancedSettings()}
        {renderThemeSettings()}
      </div>
    </div>
  );
};

export default Settings;
