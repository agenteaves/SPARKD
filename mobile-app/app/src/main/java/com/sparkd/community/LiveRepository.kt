package com.sparkd.community

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL

/** Read-only access to the same public contest data used by sparkdcoin.com. */
class LiveRepository : SparkdRepository {
    private val api = "https://uxpbgzksfizkyxubctep.supabase.co"
    private val publishableKey = "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J"

    private suspend fun get(path: String): JSONArray = withContext(Dispatchers.IO) {
        val connection = (URL("$api/rest/v1/$path").openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"; connectTimeout = 15_000; readTimeout = 20_000
            setRequestProperty("apikey", publishableKey)
            setRequestProperty("Authorization", "Bearer $publishableKey")
        }
        val code = connection.responseCode
        val body = (if (code in 200..299) connection.inputStream else connection.errorStream)
            ?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (code !in 200..299) throw IllegalStateException("Contest service is unavailable (HTTP $code).")
        JSONArray(body)
    }

    override suspend fun contest(): Contest {
        val rows = get("meme_week_contests?select=*&order=week_start.desc&limit=1")
        if (rows.length() == 0) throw IllegalStateException("No SPARKD contest is available right now.")
        val c = rows.getJSONObject(0)
        return Contest(
            id = c.getString("id"),
            title = c.optString("title", "Meme of the Week"),
            phase = c.optString("status", "OPEN").uppercase().replace('_', ' '),
            prize = c.optString("prize", c.optString("prize_description", "Weekly SPARKD prize")),
            entries = c.optInt("submission_count", 0)
        )
    }

    override suspend fun memes(): List<Meme> {
        val rows = get("meme_week_submissions?select=id,meme_title,wallet_address,meme_image_url,status,created_at&status=eq.approved&order=created_at.desc")
        return List(rows.length()) { index ->
            val m = rows.getJSONObject(index)
            val path = m.optString("meme_image_url")
            Meme(m.getString("id"), m.optString("meme_title", "Untitled SPARKD Meme"),
                m.optString("wallet_address", "SPARKD Creator"), imageUrl(path), 0)
        }
    }

    override suspend fun winners(): List<Winner> = emptyList()

    private fun imageUrl(path: String): String = if (path.startsWith("http")) path else
        "$api/storage/v1/object/public/sparkd-contest-submissions/" + path.split('/').joinToString("/") { URLEncoder.encode(it, "UTF-8") }
}
