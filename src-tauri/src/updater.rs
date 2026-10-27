use serde::Serialize;
use tauri::{ipc::Channel, AppHandle};

// Only release assets from this repository may be downloaded and installed.
const RELEASE_DOWNLOAD_PREFIX: &str =
  "https://github.com/ManfredRichthofen/Bar-Pi/releases/download/";

#[cfg(target_os = "android")]
const ASSET_NAME: Option<&str> = Some("app-release.apk");
#[cfg(windows)]
const ASSET_NAME: Option<&str> = Some("Bar-Pi-Setup.exe");
#[cfg(not(any(target_os = "android", windows)))]
const ASSET_NAME: Option<&str> = None;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTarget {
  asset: &'static str,
  dev_build: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
  downloaded: u64,
  total: Option<u64>,
}

#[tauri::command]
pub fn update_target() -> Option<UpdateTarget> {
  ASSET_NAME.map(|asset| UpdateTarget {
    asset,
    dev_build: cfg!(debug_assertions),
  })
}

#[tauri::command]
pub async fn install_update(
  app: AppHandle,
  url: String,
  on_progress: Channel<DownloadProgress>,
) -> Result<(), String> {
  let asset = ASSET_NAME.ok_or("Updates are not supported on this platform")?;
  if !url.starts_with(RELEASE_DOWNLOAD_PREFIX) || !url.ends_with(&format!("/{asset}")) {
    return Err("Refusing to download update from an unexpected URL".into());
  }
  platform::install(&app, &url, asset, on_progress).await
}

#[cfg(target_os = "android")]
mod platform {
  use super::DownloadProgress;
  use serde::Serialize;
  use tauri::{
    ipc::Channel,
    plugin::{Builder, PluginHandle, TauriPlugin},
    AppHandle, Manager, Runtime, Wry,
  };

  pub struct AppUpdater<R: Runtime>(PluginHandle<R>);

  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  struct InstallPayload<'a> {
    url: &'a str,
    file_name: &'a str,
    on_progress: Channel<DownloadProgress>,
  }

  pub fn plugin<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("app-updater")
      .setup(|app, api| {
        let handle = api.register_android_plugin("com.barpi.app", "AppUpdaterPlugin")?;
        app.manage(AppUpdater(handle));
        Ok(())
      })
      .build()
  }

  pub async fn install(
    app: &AppHandle,
    url: &str,
    asset: &str,
    on_progress: Channel<DownloadProgress>,
  ) -> Result<(), String> {
    let updater = app.state::<AppUpdater<Wry>>();
    updater
      .0
      .run_mobile_plugin::<serde_json::Value>(
        "installUpdate",
        InstallPayload {
          url,
          file_name: asset,
          on_progress,
        },
      )
      .map(|_| ())
      .map_err(|e| e.to_string())
  }
}

#[cfg(windows)]
mod platform {
  use super::DownloadProgress;
  use std::{fs::File, io::Write, process::Command};
  use tauri::{ipc::Channel, AppHandle, Manager};

  const PROGRESS_STEP_BYTES: u64 = 256 * 1024;

  pub async fn install(
    app: &AppHandle,
    url: &str,
    asset: &str,
    on_progress: Channel<DownloadProgress>,
  ) -> Result<(), String> {
    let dir = app
      .path()
      .app_cache_dir()
      .map_err(|e| e.to_string())?
      .join("updates");
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(asset);

    let client = reqwest::Client::builder()
      .user_agent("Bar-Pi")
      .build()
      .map_err(|e| e.to_string())?;
    let mut response = client
      .get(url)
      .send()
      .await
      .and_then(|r| r.error_for_status())
      .map_err(|e| format!("Download failed: {e}"))?;
    let total = response.content_length();

    let mut file = File::create(&path).map_err(|e| e.to_string())?;
    let mut downloaded = 0u64;
    let mut last_reported = 0u64;
    while let Some(chunk) = response
      .chunk()
      .await
      .map_err(|e| format!("Download failed: {e}"))?
    {
      file.write_all(&chunk).map_err(|e| e.to_string())?;
      downloaded += chunk.len() as u64;
      if downloaded - last_reported >= PROGRESS_STEP_BYTES {
        let _ = on_progress.send(DownloadProgress { downloaded, total });
        last_reported = downloaded;
      }
    }
    file.flush().map_err(|e| e.to_string())?;
    drop(file);
    let _ = on_progress.send(DownloadProgress { downloaded, total });

    // /P runs the NSIS installer in passive mode, /R relaunches the app afterwards
    Command::new(&path)
      .args(["/P", "/R"])
      .spawn()
      .map_err(|e| format!("Could not start installer: {e}"))?;
    app.exit(0);
    Ok(())
  }
}

#[cfg(not(any(target_os = "android", windows)))]
mod platform {
  use super::DownloadProgress;
  use tauri::{ipc::Channel, AppHandle};

  pub async fn install(
    _app: &AppHandle,
    _url: &str,
    _asset: &str,
    _on_progress: Channel<DownloadProgress>,
  ) -> Result<(), String> {
    Err("Updates are not supported on this platform".into())
  }
}

#[cfg(target_os = "android")]
pub use platform::plugin;
