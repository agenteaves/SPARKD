package com.sparkd.community

import android.content.Context
import android.util.Base64
import org.json.JSONObject

data class PendingBurn(
    val contestId: String,
    val wallet: String,
    val signedTransaction: ByteArray,
    val transactionSignature: String?,
    val lastValidBlockHeight: Long?,
    val quoteToken: String?
)

class BurnRecoveryStore(context: Context) {
    private val prefs = context.getSharedPreferences("sparkd-burn-recovery", Context.MODE_PRIVATE)

    fun save(contestId: String, wallet: String, signedTransaction: ByteArray, transactionSignature: String? = null, lastValidBlockHeight: Long? = null, quoteToken: String? = null) {
        require(contestId.isNotBlank() && wallet.isNotBlank() && signedTransaction.isNotEmpty())
        val json = JSONObject()
            .put("contestId", contestId)
            .put("wallet", wallet)
            .put("signedTransaction", Base64.encodeToString(signedTransaction, Base64.NO_WRAP))
        transactionSignature?.let { json.put("transactionSignature", it) }
        lastValidBlockHeight?.let { json.put("lastValidBlockHeight", it) }
        quoteToken?.let { json.put("quoteToken", it) }
        prefs.edit().putString("pending", json.toString()).apply()
    }

    fun pending(): PendingBurn? {
        val raw = prefs.getString("pending", null) ?: return null
        return runCatching {
            val json = JSONObject(raw)
            PendingBurn(
                json.getString("contestId"),
                json.getString("wallet"),
                Base64.decode(json.getString("signedTransaction"), Base64.DEFAULT),
                json.optString("transactionSignature").takeIf { it.isNotBlank() },
                if (json.has("lastValidBlockHeight")) json.getLong("lastValidBlockHeight") else null,
                json.optString("quoteToken").takeIf { it.isNotBlank() }
            )
        }.getOrNull()
    }

    fun clear() { prefs.edit().remove("pending").apply() }
}
