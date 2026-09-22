package com.sparkd.community

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdate(val versionCode: Int, val versionName: String, val downloadUrl: String)

class AppUpdateRepository {
    suspend fun latest(): AppUpdate? = withContext(Dispatchers.IO) {
        val connection = (URL("https://sparkdcoin.com/app-version.json").openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 8_000
            readTimeout = 8_000
            useCaches = false
        }
        try {
            if (connection.responseCode !in 200..299) return@withContext null
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(body)
            AppUpdate(
                json.getInt("versionCode"),
                json.optString("versionName", "new"),
                json.optString("downloadUrl", "https://github.com/agenteaves/SPARKD/releases/download/android-production/SPARKD-Mobile.apk")
            )
        } finally {
            connection.disconnect()
        }
    }
}
