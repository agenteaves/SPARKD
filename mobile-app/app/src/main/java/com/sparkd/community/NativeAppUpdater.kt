package com.sparkd.community

import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.MessageDigest

fun trustedUpdateUrl(value: String): Boolean = runCatching {
    val uri = URI(value)
    uri.scheme == "https" && uri.host in setOf("sparkdcoin.com", "www.sparkdcoin.com") &&
        uri.userInfo == null && uri.port in setOf(-1, 443) &&
        uri.path.startsWith("/downloads/SPARKD-Mobile-") && uri.path.endsWith(".apk") &&
        uri.query == null && uri.fragment == null && !uri.path.contains("..")
}.getOrDefault(false)

fun updateFileSha256(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { input ->
        val bytes = ByteArray(65536)
        while (true) { val count = input.read(bytes); if (count < 0) break; digest.update(bytes, 0, count) }
    }
    return digest.digest().joinToString("") { "%02x".format(it) }
}

@Suppress("DEPRECATION")
private fun appSignatures(info: PackageInfo): Set<String> {
    val signatures = if (Build.VERSION.SDK_INT >= 28) info.signingInfo?.apkContentsSigners else info.signatures
    return signatures.orEmpty().map { signature ->
        MessageDigest.getInstance("SHA-256").digest(signature.toByteArray()).joinToString("") { "%02x".format(it) }
    }.toSet()
}

@Suppress("DEPRECATION")
private fun verifyAppUpdate(context: Context, file: File, update: AppUpdate) {
    check(update.sha256.matches(Regex("[0-9a-f]{64}"))) { "The update has no valid checksum." }
    check(updateFileSha256(file) == update.sha256) { "The download is incomplete or its checksum does not match. Retry the download." }
    val flags = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
    val apk = context.packageManager.getPackageArchiveInfo(file.absolutePath, flags) ?: error("The downloaded file is not a valid Android app.")
    val installed = context.packageManager.getPackageInfo(context.packageName, flags)
    val code = if (Build.VERSION.SDK_INT >= 28) apk.longVersionCode else apk.versionCode.toLong()
    val installedCode = if (Build.VERSION.SDK_INT >= 28) installed.longVersionCode else installed.versionCode.toLong()
    check(apk.packageName == context.packageName && code == update.versionCode.toLong() && code > installedCode) { "The downloaded app version does not match this update." }
    val expected = appSignatures(installed)
    check(expected.isNotEmpty() && appSignatures(apk) == expected) { "The update was not signed with the installed SPARKD app's signing certificate." }
}

suspend fun downloadAppUpdate(context: Context, update: AppUpdate, progress: suspend (Float?, String) -> Unit): File = withContext(Dispatchers.IO) {
    check(trustedUpdateUrl(update.downloadUrl)) { "The update download must come from the SPARKD website." }
    val folder = File(context.cacheDir, "updates").apply { check(exists() || mkdirs()) { "Cannot create update download folder." } }
    val file = File(folder, "SPARKD-${update.versionCode}.apk")
    if (file.exists()) {
        if (runCatching { verifyAppUpdate(context, file, update) }.isSuccess) return@withContext file
        file.delete()
    }
    val partial = File(folder, "SPARKD-${update.versionCode}.partial")
    partial.delete()
    var currentUrl = update.downloadUrl
    var connection: HttpURLConnection? = null
    val started = System.nanoTime()
    try {
        repeat(4) {
            check(trustedUpdateUrl(currentUrl)) { "Update redirected outside the SPARKD website." }
            val candidate = (URL(currentUrl).openConnection() as HttpURLConnection).apply {
                connectTimeout = 15000; readTimeout = 20000; instanceFollowRedirects = false; useCaches = false
                setRequestProperty("Accept", "application/vnd.android.package-archive, application/octet-stream")
            }
            connection = candidate
            if (candidate.responseCode in listOf(301, 302, 303, 307, 308)) {
                currentUrl = URI(currentUrl).resolve(candidate.getHeaderField("Location") ?: error("Invalid update redirect.")).toString()
                candidate.disconnect(); connection = null
            } else {
                check(candidate.responseCode == 200) { "Update server returned HTTP ${candidate.responseCode}." }
                val length = candidate.contentLengthLong
                check(length <= 100_000_000) { "Update download is too large." }
                var received = 0L
                candidate.inputStream.use { input -> partial.outputStream().use { output ->
                    val buffer = ByteArray(65536)
                    while (true) {
                        currentCoroutineContext().ensureActive()
                        check(System.nanoTime() - started < 120_000_000_000L) { "Download timed out. Check your connection and retry." }
                        val count = input.read(buffer); if (count < 0) break
                        received += count
                        check(received <= 100_000_000) { "Update download is too large." }
                        output.write(buffer, 0, count)
                        withContext(Dispatchers.Main) {
                            progress(if (length > 0) (received.toFloat() / length).coerceIn(0f, 1f) else null,
                                if (length > 0) "Downloading: ${received * 100 / length}%"
                                else "Downloaded ${received / 1024} KB")
                        }
                    }
                } }
                check(length <= 0 || received == length) { "The update download did not finish. Retry the download." }
                withContext(Dispatchers.Main) { progress(1f, "Verifying the downloaded SPARKD update…") }
                verifyAppUpdate(context, partial, update)
                check(partial.renameTo(file)) { "Unable to save the verified update." }
                return@withContext file
            }
        }
        error("Too many update redirects.")
    } finally { connection?.disconnect(); partial.delete() }
}

fun installAppUpdate(context: Context, file: File, update: AppUpdate): Boolean {
    verifyAppUpdate(context, file, update)
    if (!context.packageManager.canRequestPackageInstalls()) {
        context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + context.packageName)))
        return false
    }
    val uri = FileProvider.getUriForFile(context, context.packageName + ".updates", file)
    context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
    return true
}
