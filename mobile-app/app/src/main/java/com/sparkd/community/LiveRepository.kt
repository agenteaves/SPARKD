package com.sparkd.community

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
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
        val body = (if (code in 200..299) connection.inputStream else connection.errorStream)?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (code !in 200..299) throw IllegalStateException("Contest service is unavailable (HTTP $code).")
        return@withContext JSONArray(body)
    }

    override suspend fun contest(): Contest {
        val rows = get("meme_week_contests?select=*&order=week_start.desc&limit=1")
        if (rows.length() == 0) throw IllegalStateException("No SPARKD contest is available right now.")
        val c = rows.getJSONObject(0)
        return Contest(c.optString("title", "Meme of the Week"),
            c.optString("status", "OPEN").uppercase().replace('_', ' '),
            c.optString("prize", c.optString("prize_description", "Weekly SPARKD prize")),
            c.optInt("submission_count", 0))
    }

    override suspend fun memes(): List<Meme> {
        val rows = get("meme_week_submissions?select=id,meme_title,wallet_address,status,created_at&status=eq.approved&order=created_at.desc")
        return List(rows.length()) { i -> rows.getJSONObject(i).let { Meme(it.optString("meme_title", "Untitled SPARKD Meme"), it.optString("wallet_address", "SPARKD Creator"), 0) } }
    }

    override suspend fun winners(): List<Winner> = emptyList()
}
