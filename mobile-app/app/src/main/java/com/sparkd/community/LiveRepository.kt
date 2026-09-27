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
        val now = java.time.Instant.now().toString()
        var rows = get("meme_week_contests?select=*&status=in.(submission,voting)&week_start=lte.$now&order=week_start.desc&limit=1")
        if (rows.length() == 0) rows = get("meme_week_contests?select=*&status=in.(upcoming,submission)&week_start=gt.$now&order=week_start.asc&limit=1")
        if (rows.length() == 0) throw IllegalStateException("No SPARKD contest is available right now.")
        val c = rows.getJSONObject(0)
        val rawStatus = c.optString("status", "OPEN")
        val phase = when (rawStatus.lowercase()) {
            "submission" -> "SUBMISSION"
            "upcoming" -> "UPCOMING"
            else -> "DRAW IN PROGRESS"
        }
        return Contest(
            c.optString("title", "Meme of the Week"),
            phase,
            "🥇 1st: $15 SOL  •  🥈 2nd: $10 SOL  •  🥉 3rd: $5 SOL",
            c.optInt("submission_count", 0),
            c.optString("id")
        )
    }

    override suspend fun memes(): List<Meme> {
        val liveContest = contest()
        val rows = get("meme_week_submissions?select=id,meme_title,meme_image_url,wallet_address,status,created_at,dna_verified&contest_id=eq.${liveContest.id}&dna_verified=eq.true&status=neq.rejected&order=created_at.desc")
        return List(rows.length()) { i -> rows.getJSONObject(i).let {
            val storedImage = it.optString("meme_image_url").takeIf { url -> url.isNotBlank() && url != "null" }
            val imageUrl = storedImage?.let { path -> if (path.startsWith("http://") || path.startsWith("https://")) path else "$api/storage/v1/object/public/sparkd-contest-submissions/" + path.trimStart('/') }
            Meme(it.optString("meme_title", "Untitled SPARKD Meme"), it.optString("wallet_address", "SPARKD Creator"), 0, it.optString("id"), imageUrl)
        } }
    }

    override suspend fun winners(): List<Winner> {
        val contests = get("meme_week_contests?select=id,week_start&status=eq.completed&order=week_start.desc&limit=25")
        if (contests.length() == 0) return emptyList()
        val contestIds = List(contests.length()) { i -> contests.getJSONObject(i).optString("id") }.filter { it.isNotBlank() }
        if (contestIds.isEmpty()) return emptyList()
        val winnerRows = get("meme_week_winners?select=contest_id,submission_id,place,payout_status&contest_id=in.(" + contestIds.joinToString(",") + ")&order=place.asc")
        val submissionIds = List(winnerRows.length()) { i -> winnerRows.getJSONObject(i).optString("submission_id") }.filter { it.isNotBlank() }.distinct()
        if (submissionIds.isEmpty()) return emptyList()
        val submissions = get("meme_week_submissions?select=id,meme_title,wallet_address&id=in.(" + submissionIds.joinToString(",") + ")")
        val byId = List(submissions.length()) { i -> submissions.getJSONObject(i) }.associateBy { it.optString("id") }
        val contestOrder = contestIds.withIndex().associate { it.value to it.index }
        return List(winnerRows.length()) { i -> winnerRows.getJSONObject(i) }
            .sortedWith(compareBy({ contestOrder[it.optString("contest_id")] ?: Int.MAX_VALUE }, { it.optInt("place", 99) }))
            .mapNotNull { row -> byId[row.optString("submission_id")]?.let { s ->
                Winner(row.optInt("place", 1), s.optString("meme_title", "SPARKD Winner"), s.optString("wallet_address", "SPARKD Creator"), row.optString("payout_status").lowercase() in setOf("paid", "completed", "executed"))
            } }
    }
}
