package com.barpi.app

import android.app.Activity
import android.content.Intent
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Channel
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

private const val PROGRESS_STEP_BYTES = 256 * 1024L

@InvokeArg
class InstallUpdateArgs {
  lateinit var url: String
  lateinit var fileName: String
  lateinit var onProgress: Channel
}

@TauriPlugin
class AppUpdaterPlugin(private val activity: Activity) : Plugin(activity) {
  @Command
  fun installUpdate(invoke: Invoke) {
    val args = invoke.parseArgs(InstallUpdateArgs::class.java)
    thread(name = "bar-pi-updater") {
      try {
        val apk = download(args)
        launchInstaller(apk)
        invoke.resolve()
      } catch (e: Exception) {
        invoke.reject(e.message ?: "Update failed")
      }
    }
  }

  private fun download(args: InstallUpdateArgs): File {
    val dir = File(activity.cacheDir, "updates")
    dir.deleteRecursively()
    dir.mkdirs()
    val target = File(dir, File(args.fileName).name)

    val conn = URL(args.url).openConnection() as HttpURLConnection
    conn.instanceFollowRedirects = true
    conn.connectTimeout = 30_000
    conn.readTimeout = 60_000
    conn.setRequestProperty("User-Agent", "Bar-Pi")
    try {
      if (conn.responseCode !in 200..299) {
        throw IOException("Download failed: HTTP ${conn.responseCode}")
      }
      val total = conn.contentLengthLong
      var downloaded = 0L
      var lastReported = 0L
      conn.inputStream.use { input ->
        target.outputStream().use { output ->
          val buffer = ByteArray(64 * 1024)
          while (true) {
            val read = input.read(buffer)
            if (read < 0) break
            output.write(buffer, 0, read)
            downloaded += read
            if (downloaded - lastReported >= PROGRESS_STEP_BYTES) {
              reportProgress(args.onProgress, downloaded, total)
              lastReported = downloaded
            }
          }
        }
      }
      reportProgress(args.onProgress, downloaded, total)
    } finally {
      conn.disconnect()
    }
    return target
  }

  private fun reportProgress(channel: Channel, downloaded: Long, total: Long) {
    val payload = JSObject()
    payload.put("downloaded", downloaded)
    if (total > 0) payload.put("total", total)
    channel.send(payload)
  }

  private fun launchInstaller(apk: File) {
    val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.fileprovider", apk)
    val intent = Intent(Intent.ACTION_VIEW).apply {
      setDataAndType(uri, "application/vnd.android.package-archive")
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    activity.startActivity(intent)
  }
}
