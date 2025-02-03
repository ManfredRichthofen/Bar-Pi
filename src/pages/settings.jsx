import React from 'react';
import { themeChange } from 'theme-change';
import { useEffect } from 'react';

const Settings = () => {
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
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Theme Settings</h2>

          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Select Theme</span>
            </label>
            <select className="select select-bordered" data-choose-theme>
              <option value="">Default</option>
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title mb-4">General Settings</h2>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Enable Notifications</span>
              <input type="checkbox" className="toggle" />
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Dark Mode</span>
              <input type="checkbox" className="toggle" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
