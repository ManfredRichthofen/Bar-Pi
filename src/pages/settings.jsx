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

      <div className="dropdown mb-72">
        <div tabIndex={0} role="button" className="btn m-1">
          Theme
          <svg
            width="12px"
            height="12px"
            class="inline-block h-2 w-2 fill-current opacity-60"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2048 2048"
          >
            <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
          </svg>
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content bg-base-300 rounded-box z-1 w-52 p-2 shadow-2xl"
        >
          <li>
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
              aria-label="Default"
              value="default"
            />
          </li>
          <li>
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
              aria-label="Retro"
              value="retro"
            />
          </li>
          <li>
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
              aria-label="Cyberpunk"
              value="cyberpunk"
            />
          </li>
          <li>
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
              aria-label="Valentine"
              value="valentine"
            />
          </li>
          <li>
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
              aria-label="Aqua"
              value="aqua"
            />
          </li>
        </ul>
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
