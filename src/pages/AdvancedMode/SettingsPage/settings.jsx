import React, { useEffect, useState } from 'react';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import useAuthStore from '../../../store/authStore';
import useUIModeStore from '../../../store/uiModeStore';
import UpdateChecker from '../../../components/UpdateChecker';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const setAdvancedMode = useUIModeStore((state) => state.setAdvancedMode);

  useEffect(() => {
    themeChange(false);
    // Set the current theme in the dropdown
    const currentTheme = localStorage.getItem('theme') || 'light';
    const themeSelect = document.querySelector('[data-choose-theme]');
    if (themeSelect) {
      themeSelect.value = currentTheme;
    }
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
      navigate({ to: '/simple/drinks', replace: true });
    }, 0);
  };

  const handleLogout = () => {
    logoutUser();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <h1 className="text-2xl font-bold text-base-content">
            {t('settings.title', 'Settings')}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 max-w-2xl mx-auto space-y-4">
        {/* Update Check Card */}
        <UpdateChecker />

        {/* General Settings Card */}
        <div className="card bg-base-200 shadow-lg border border-base-300">
          <div className="card-body p-6">
            <h2 className="card-title text-xl mb-4 text-base-content">
              {t('settings.general.title')}
            </h2>

            <div className="space-y-4">
              {/* Language Selector */}
              <fieldset className="fieldset border-base-300">
                <legend className="fieldset-legend text-base-content font-medium">
                  {t('settings.general.language_label')}
                </legend>
                <select
                  className="select select-bordered w-full h-12 min-h-12 border-base-300 focus:border-primary"
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </fieldset>

              <div className="divider my-1"></div>

              {/* Toggle Switches */}
              <div className="space-y-3">
                <label className="flex items-center justify-between py-3 touch-none hover:bg-base-300/50 rounded-lg px-2 transition-colors">
                  <span className="label-text flex-1 mr-4 font-medium text-base-content">
                    {t('settings.general.notifications')}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-lg"
                  />
                </label>

                <label className="flex items-center justify-between py-3 touch-none hover:bg-base-300/50 rounded-lg px-2 transition-colors">
                  <span className="label-text flex-1 mr-4 font-medium text-base-content">
                    {t('settings.general.sound_effects')}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-lg"
                  />
                </label>

                <div className="divider my-1"></div>

                {/* Simple Mode Switch */}
                <div className="flex items-center justify-between py-3 hover:bg-base-300/50 rounded-lg px-2 transition-colors">
                  <span className="label-text flex-1 mr-4 font-medium text-base-content">
                    Switch to Simple Mode
                  </span>
                  <button
                    className="btn btn-primary h-12 min-h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={handleSimpleModeSwitch}
                  >
                    Switch
                  </button>
                </div>

                <div className="divider my-2"></div>

                {/* Logout Button */}
                <div className="flex items-center justify-between py-3 hover:bg-base-300/50 rounded-lg px-2 transition-colors">
                  <span className="label-text flex-1 mr-4 font-medium text-base-content">
                    {t('common.logout')}
                  </span>
                  <button
                    className="btn btn-error h-12 min-h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
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
        <div className="card bg-base-200 shadow-lg border border-base-300">
          <div className="card-body p-6">
            <h2 className="card-title text-xl mb-4 text-base-content">
              {t('settings.appearance.title')}
            </h2>

            <fieldset className="fieldset border-base-300">
              <legend className="fieldset-legend text-base-content font-medium">
                {t('settings.appearance.theme_label', 'Theme')}
              </legend>
              <select
                className="select select-bordered w-full h-12 min-h-12 border-base-300 focus:border-primary"
                data-choose-theme
                defaultValue="light"
                onChange={(e) => {
                  const theme = e.target.value;
                  document.documentElement.setAttribute('data-theme', theme);
                  localStorage.setItem('theme', theme);
                }}
              >
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
