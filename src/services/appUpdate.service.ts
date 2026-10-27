import { getVersion } from '@tauri-apps/api/app';
import { Channel, invoke, isTauri } from '@tauri-apps/api/core';
import type { UpdateChannel } from '@/components/updates/UpdateSettings';

const RELEASES_API =
  'https://api.github.com/repos/ManfredRichthofen/Bar-Pi/releases';

export interface AppUpdateTarget {
  asset: string;
  devBuild: boolean;
}

export interface AppRelease {
  version: string;
  prerelease: boolean;
  notes?: string;
  releaseUrl: string;
  downloadUrl: string;
}

export interface DownloadProgress {
  downloaded: number;
  total?: number;
}

interface GithubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  body?: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
}

interface ParsedVersion {
  core: number[];
  pre: string[];
}

const parseVersion = (version: string): ParsedVersion | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(
    version.trim(),
  );
  if (!match) return null;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] ? match[4].split('.') : [],
  };
};

const comparePrerelease = (a: string[], b: string[]) => {
  if (a.length === 0 || b.length === 0) return b.length - a.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    const aNum = /^\d+$/.test(a[i]);
    const bNum = /^\d+$/.test(b[i]);
    if (aNum && bNum) {
      const diff = Number(a[i]) - Number(b[i]);
      if (diff !== 0) return diff;
    } else if (aNum !== bNum) {
      return aNum ? -1 : 1;
    } else if (a[i] !== b[i]) {
      return a[i] < b[i] ? -1 : 1;
    }
  }
  return 0;
};

/** Semver comparison; returns a positive number when `a` is newer than `b`. */
export const compareVersions = (a: string, b: string) => {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa.core[i] !== pb.core[i]) return pa.core[i] - pb.core[i];
  }
  return comparePrerelease(pa.pre, pb.pre);
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) {
    throw new Error(`GitHub responded with ${response.status}`);
  }
  return response.json();
};

const toAppRelease = (
  release: GithubRelease,
  asset: string,
): AppRelease | null => {
  const file = release.assets.find((a) => a.name === asset);
  if (release.draft || !file || !parseVersion(release.tag_name)) return null;
  return {
    version: release.tag_name.replace(/^v/, ''),
    prerelease: release.prerelease,
    notes: release.body,
    releaseUrl: release.html_url,
    downloadUrl: file.browser_download_url,
  };
};

class AppUpdateService {
  isAvailable() {
    return isTauri();
  }

  getTarget(): Promise<AppUpdateTarget | null> {
    return invoke('update_target');
  }

  getCurrentVersion(): Promise<string> {
    return getVersion();
  }

  async fetchLatestRelease(
    channel: UpdateChannel,
    asset: string,
  ): Promise<AppRelease | null> {
    if (channel === 'release') {
      const latest = await fetchJson<GithubRelease>(`${RELEASES_API}/latest`);
      return toAppRelease(latest, asset);
    }

    const releases = await fetchJson<GithubRelease[]>(
      `${RELEASES_API}?per_page=20`,
    );
    return releases
      .map((release) => toAppRelease(release, asset))
      .filter((release): release is AppRelease => release !== null)
      .reduce<AppRelease | null>(
        (best, release) =>
          !best || compareVersions(release.version, best.version) > 0
            ? release
            : best,
        null,
      );
  }

  install(
    release: AppRelease,
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const channel = new Channel<DownloadProgress>();
    channel.onmessage = onProgress;
    return invoke('install_update', {
      url: release.downloadUrl,
      onProgress: channel,
    });
  }
}

export default new AppUpdateService();
