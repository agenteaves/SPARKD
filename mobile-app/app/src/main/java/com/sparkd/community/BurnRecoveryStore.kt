package com.sparkd.community

import android.content.Context
import android.util.Base64
import org.json.JSONObject

data class PendingBurn(val contestId: String, val wallet: String, val signedTransaction: ByteArray)

class BurnRecoveryStore(context: Context) {
    private val prefs = context.getSharedPreferences("sparkd-burn-recovery", Context.MODE_PRIVATE)

    fun save(contestId: String, wallet: String, signedTransaction: ByteArray) {
        require(contestId.isNotBlank() && wallet.isNotBlank() && signedTransaction.isNotEmpty())
        prefs.edit().putString("pending", JSONObject()
            .put("contestId", contestId)
            .put("wallet", wallet)
            .put("signedTransaction", Base64.encodeToString(signedTransaction, Base64.NO_WRAP))
            .toString()).apply()
    }

    fun pending(): PendingBurn? {
        val raw = prefs.getString("pending", null) ?: return null
        return runCatching {
            val json = JSONObject(raw)
            PendingBurn(
                json.getString("contestId"),
                json.getString("wallet"),
                Base64.decode(json.getString("signedTransaction"), Base64.DEFAULT)
            )
        }.getOrNull()
    }

    fun clear() {
        prefs.edit().remove("pending").apply()
    }
}
