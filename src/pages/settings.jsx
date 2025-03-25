import React, { useEffect, useState } from 'react';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useUIModeStore from '../store/uiModeStore';
import UpdateChecker from '../components/UpdateChecker';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

  useEffect(() => {
    themeChange(false);
  }, []);

  const themes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
  ];

  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const handleSimpleModeSwitch = () => {
    setAdvancedMode(false);
    setTimeout(() => {
      navigate('/simple/drinks', { replace: true });
    }, 0);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-base-100 border-b border-base-200">
        <div className="px-3 py-3 flex items-center">
          <h1 className="text-xl font-bold">
            {t('settings.title', 'Settings')}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 pb-20 max-w-2xl mx-auto space-y-2">
        {/* Update Check Card */}
        <UpdateChecker />

        {/* General Settings Card */}
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <h2 className="card-title text-lg mb-3">
              {t('settings.general.title')}
            </h2>

            <div className="space-y-3">
              {/* Language Selector */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium">
                    {t('settings.general.language_label')}
                  </span>
                </label>
                <select
                  className="select select-bordered w-full h-12 min-h-12"
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

              <div className="divider my-1"></div>

              {/* Toggle Switches */}
              <div className="space-y-2">
                <label className="flex items-center justify-between py-2 touch-none">
                  <span className="label-text flex-1 mr-4">
                    {t('settings.general.notifications')}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-lg"
                  />
                </label>

                <label className="flex items-center justify-between py-2 touch-none">
                  <span className="label-text flex-1 mr-4">
                    {t('settings.general.sound_effects')}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-lg"
                  />
                </label>

                <div className="divider my-1"></div>

                {/* Simple Mode Switch */}
                <div className="flex items-center justify-between py-2">
                  <span className="label-text flex-1 mr-4">
                    Switch to Simple Mode
                  </span>
                  <button
                    className="btn btn-primary h-12 min-h-12 px-6"
                    onClick={handleSimpleModeSwitch}
                  >
                    Switch
                  </button>
                </div>

                <div className="divider my-1"></div>

                {/* Logout Button */}
                <div className="flex items-center justify-between py-2">
                  <span className="label-text flex-1 mr-4">
                    {t('common.logout')}
                  </span>
                  <button
                    className="btn btn-error h-12 min-h-12 px-6"
                    onClick={handleLogout}
                  >
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selector Card */}
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <h2 className="card-title text-lg mb-3">
              {t('settings.appearance.title')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {themes.map((theme) => (
                <button
                  key={theme}
                  data-set-theme={theme}
                  data-act-class="active"
                  className="theme-controller btn h-12 min-h-12 normal-case hover:btn-primary active:btn-primary text-sm px-2"
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
