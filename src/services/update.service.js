import axios from "axios";
import pkg from "../../package.json";

const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "ManfredRichthofen";
const REPO_NAME = "Bar-Pi";
const CURRENT_VERSION = pkg.version;

class UpdateService {
	async checkForUpdates() {
		try {
			// Get latest release from GitHub
			const response = await axios.get(
				`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
			);

			const latestRelease = response.data;
			const latestVersion = latestRelease.tag_name.replace("v", "");

			// Compare versions
			const hasUpdate =
				this.compareVersions(CURRENT_VERSION, latestVersion) < 0;

			// Format release notes
			const formattedReleaseNotes = this.formatReleaseNotes(latestRelease.body);

			return {
				hasUpdate,
				currentVersion: CURRENT_VERSION,
				latestVersion,
				releaseNotes: formattedReleaseNotes,
				downloadUrl: latestRelease.html_url,
				assets: latestRelease.assets,
			};
		} catch (error) {
			console.error("Error checking for updates:", error);
			return {
				hasUpdate: false,
				error: error.message,
			};
		}
	}

	compareVersions(v1, v2) {
		const v1Parts = v1.split(".").map(Number);
		const v2Parts = v2.split(".").map(Number);

		for (let i = 0; i < 3; i++) {
			if (v1Parts[i] > v2Parts[i]) return 1;
			if (v1Parts[i] < v2Parts[i]) return -1;
		}
		return 0;
	}

	formatReleaseNotes(notes) {
		if (!notes) return "No release notes available.";

		const sections = notes.split(/(?=^#{1,6}\s)/m);

		return sections
			.map((section) => {
				section = section.trim();

				if (section.startsWith("#")) {
					const [header, ...content] = section.split("\n");
					const level = header.match(/^#+/)[0].length;
					const title = header.replace(/^#+\s+/, "");

					// Format the content
					const formattedContent = content
						.join("\n")
						.trim()
						.split("\n")
						.map((line) => {
							if (line.trim().startsWith("- ")) {
								return `• ${line.trim().substring(2)}`;
							}
							return line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
						})
						.join("\n");

					return `${title}\n${formattedContent}`;
				}

				return section
					.split("\n")
					.map((line) => {
						if (line.trim().startsWith("- ")) {
							return `• ${line.trim().substring(2)}`;
						}
						return line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
					})
					.join("\n");
			})
			.join("\n\n");
	}

	async performUpdate() {
		try {
			// Get the latest release info
			const updateInfo = await this.checkForUpdates();

			if (!updateInfo.hasUpdate) {
				throw new Error("No update available");
			}

			// Find the dist.zip asset
			const distAsset = updateInfo.assets.find(
				(asset) => asset.name === `${updateInfo.latestVersion}.zip`,
			);

			if (!distAsset) {
				throw new Error("Update package not found");
			}

			// Download the update package
			const response = await axios.get(distAsset.browser_download_url, {
				responseType: "blob",
			});

			// Convert blob to array buffer
			const arrayBuffer = await response.data.arrayBuffer();

			// Create a JSZip instance
			const zip = new JSZip();

			// Load the zip content
			const zipContent = await zip.loadAsync(arrayBuffer);

			// Extract all files
			const files = zipContent.files;

			// Create a map of file paths to their content
			const fileMap = new Map();

			for (const [path, file] of Object.entries(files)) {
				if (!file.dir) {
					const content = await file.async("blob");
					fileMap.set(path, content);
				}
			}

			// Store the files in IndexedDB for later use
			const db = await this.openUpdateDB();
			await this.storeFiles(db, fileMap);

			// Store update metadata
			await this.storeUpdateMetadata(db, {
				version: updateInfo.latestVersion,
				timestamp: Date.now(),
			});

			// Reload the page to apply the update
			window.location.reload();

			return true;
		} catch (error) {
			console.error("Error performing update:", error);
			throw error;
		}
	}

	async openUpdateDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open("BarPiUpdates", 1);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = event.target.result;

				// Create object stores
				if (!db.objectStoreNames.contains("files")) {
					db.createObjectStore("files");
				}
				if (!db.objectStoreNames.contains("metadata")) {
					db.createObjectStore("metadata");
				}
			};
		});
	}

	async storeFiles(db, fileMap) {
		const transaction = db.transaction(["files"], "readwrite");
		const store = transaction.objectStore("files");

		for (const [path, content] of fileMap) {
			await store.put(content, path);
		}

		return new Promise((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}

	async storeUpdateMetadata(db, metadata) {
		const transaction = db.transaction(["metadata"], "readwrite");
		const store = transaction.objectStore("metadata");

		await store.put(metadata, "current");

		return new Promise((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}

	async applyUpdate() {
		try {
			const db = await this.openUpdateDB();
			const transaction = db.transaction(["files"], "readonly");
			const store = transaction.objectStore("files");

			// Get all files
			const files = await store.getAll();

			// Apply each file
			for (const file of files) {
				const path = file.path;
				const content = file.content;

				// Create a blob URL
				const blobUrl = URL.createObjectURL(content);

				// Fetch and replace the file
				await fetch(path, {
					method: "PUT",
					body: content,
				});

				URL.revokeObjectURL(blobUrl);
			}

			// Clear the update database
			await this.clearUpdateDB();

			return true;
		} catch (error) {
			console.error("Error applying update:", error);
			throw error;
		}
	}

	async clearUpdateDB() {
		const db = await this.openUpdateDB();
		const transaction = db.transaction(["files", "metadata"], "readwrite");

		await Promise.all([
			transaction.objectStore("files").clear(),
			transaction.objectStore("metadata").clear(),
		]);

		return new Promise((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
		});
	}
}

export default new UpdateService();
