import React, { useEffect } from 'react';
import { themeChange } from 'theme-change';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const { t, i18n } = useTranslation();

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

  return (
    <div className="p-3 sm:p-4 max-w-4xl mx-auto pt-20 sm:pt-24">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">
        {t('settings.title', 'Settings')}
      </h1>

      <div className="space-y-4 sm:space-y-6">
        {/* General Settings Card */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title text-lg sm:text-xl mb-4 sm:mb-6">
              {t('settings.general', 'General Settings')}
            </h2>

            <div className="space-y-4 sm:space-y-6">
              {/* Language Dropdown */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    {t('settings.language', 'Language')}
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

              <div className="divider my-2 sm:my-4"></div>

              {/* Notification Settings */}
              <div className="space-y-3 sm:space-y-4">
                <label className="label cursor-pointer justify-between py-2">
                  <span className="label-text text-sm sm:text-base mr-4">
                    {t('settings.notifications', 'Enable Notifications')}
                  </span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary toggle-sm sm:toggle-md" 
                  />
                </label>

                <label className="label cursor-pointer justify-between py-2">
                  <span className="label-text text-sm sm:text-base mr-4">
                    {t('settings.soundEffects', 'Sound Effects')}
                  </span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary toggle-sm sm:toggle-md" 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selector Card */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title text-lg sm:text-xl mb-4 sm:mb-6">
              {t('settings.appearance', 'Appearance')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  data-set-theme={theme}
                  data-act-class="active"
                  className="theme-controller btn btn-sm h-auto py-2 normal-case hover:btn-primary text-xs sm:text-sm"
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
