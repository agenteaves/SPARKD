package com.sparkd.community

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.math.BigDecimal
import java.net.HttpURLConnection
import java.net.URL

/** Read-only SPARKD balance lookup. No wallet credentials or signing data are used. */
class SparkdBalanceRepository {
    companion object {
        const val SPARKD_MINT = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
        const val BUY_URL = "https://jup.ag/swap/SOL-$SPARKD_MINT"
    }

    suspend fun balance(owner: String): BigDecimal = withContext(Dispatchers.IO) {
        val request = JSONObject()
            .put("jsonrpc", "2.0")
            .put("id", 1)
            .put("method", "getTokenAccountsByOwner")
            .put("params", JSONArray()
                .put(owner)
                .put(JSONObject().put("mint", SPARKD_MINT))
                .put(JSONObject().put("encoding", "jsonParsed")))

        val connection = (URL("https://api.mainnet-beta.solana.com").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            doOutput = true
            connectTimeout = 15_000
            readTimeout = 20_000
            setRequestProperty("Content-Type", "application/json")
        }
        connection.outputStream.use { it.write(request.toString().toByteArray(Charsets.UTF_8)) }
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (code !in 200..299) error("Solana balance service is unavailable (HTTP $code).")

        val json = JSONObject(body)
        json.optJSONObject("error")?.let { error(it.optString("message", "Unable to read SPARKD balance.")) }
        val accounts = json.getJSONObject("result").getJSONArray("value")
        var total = BigDecimal.ZERO
        for (i in 0 until accounts.length()) {
            val tokenAmount = accounts.getJSONObject(i)
                .getJSONObject("account")
                .getJSONObject("data")
                .getJSONObject("parsed")
                .getJSONObject("info")
                .getJSONObject("tokenAmount")
            val displayed = tokenAmount.optString("uiAmountString", "0")
            total = total.add(displayed.toBigDecimalOrNull() ?: BigDecimal.ZERO)
        }
        total
    }
}
