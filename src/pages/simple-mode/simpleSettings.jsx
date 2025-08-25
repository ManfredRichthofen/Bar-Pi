import React, { useEffect, useState } from 'react';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Palette, Bell, Volume2, LogOut, Settings as SettingsIcon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import UpdateChecker from '../../components/UpdateChecker';

const SimpleSettings = ({ onModeChange }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

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

  const handleAdvancedModeSwitch = () => {
    onModeChange(true);
    setTimeout(() => {
      navigate('/drinks', { replace: true });
    }, 0);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/simple/drinks')}
            className="btn btn-ghost btn-sm p-3 hover:bg-base-200 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold truncate flex-1 mx-3 text-center">
            {t('settings.title', 'Settings')}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Update Check Card */}
          <UpdateChecker />

          {/* General Settings Card */}
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                {t('settings.general.title')}
              </h2>

              <div className="space-y-4">
                {/* Language Selector */}
                <div className="form-control">
                  <label className="label py-2">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('settings.general.language_label')}
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full h-12 text-base"
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

                <div className="divider my-2"></div>

                {/* Toggle Switches */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-3 touch-none">
                    <span className="label-text flex-1 mr-4 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      {t('settings.general.notifications')}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-lg"
                    />
                  </label>

                  <label className="flex items-center justify-between py-3 touch-none">
                    <span className="label-text flex-1 mr-4 flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      {t('settings.general.sound_effects')}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-lg"
                    />
                  </label>

                  <div className="divider my-2"></div>

                  {/* Advanced Mode Switch */}
                  <div className="flex items-center justify-between py-3">
                    <span className="label-text flex-1 mr-4">
                      Switch to Advanced Mode
                    </span>
                    <button
                      className="btn btn-primary h-12 px-6 text-base font-semibold"
                      onClick={handleAdvancedModeSwitch}
                    >
                      Switch
                    </button>
                  </div>

                  <div className="divider my-2"></div>

                  {/* Logout Button */}
                  <div className="flex items-center justify-between py-3">
                    <span className="label-text flex-1 mr-4 flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </span>
                    <button
                      className="btn btn-error h-12 px-6 text-base font-semibold"
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
          <div className="card bg-base-200/50">
            <div className="card-body p-4">
              <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t('settings.appearance.title')}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    data-set-theme={theme}
                    data-act-class="active"
                    className="theme-controller btn h-12 normal-case hover:btn-primary active:btn-primary text-sm px-2 font-medium"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettings;
