package com.sparkd.community

import android.content.Context
import android.util.Base64
import org.json.JSONObject
import java.math.BigInteger

data class PendingBurn(
    val contestId: String,
    val wallet: String,
    val signedTransaction: ByteArray,
    val transactionSignature: String?,
    val lastValidBlockHeight: Long?,
    val quoteToken: String?
)

class BurnRecoveryStore(context: Context) {
    companion object {
        // The first signature in a Solana legacy signed transaction is its transaction ID.
        fun signatureFromSignedTransaction(bytes: ByteArray): String? {
            if (bytes.size < 65 || bytes[0].toInt() != 1) return null
            val signature = bytes.copyOfRange(1, 65)
            if (signature.all { it.toInt() == 0 }) return null
            val alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
            var value = BigInteger(1, signature)
            val result = StringBuilder()
            while (value > BigInteger.ZERO) {
                val parts = value.divideAndRemainder(BigInteger.valueOf(58))
                result.append(alphabet[parts[1].toInt()])
                value = parts[0]
            }
            for (byte in signature) {
                if (byte.toInt() != 0) break
                result.append('1')
            }
            return result.reverse().toString()
        }
    }
    private val prefs = context.getSharedPreferences("sparkd-burn-recovery", Context.MODE_PRIVATE)

    fun save(contestId: String, wallet: String, signedTransaction: ByteArray, transactionSignature: String? = null, lastValidBlockHeight: Long? = null, quoteToken: String? = null) {
        require(contestId.isNotBlank() && wallet.isNotBlank() && signedTransaction.isNotEmpty())
        val json = JSONObject()
            .put("contestId", contestId)
            .put("wallet", wallet)
            .put("signedTransaction", Base64.encodeToString(signedTransaction, Base64.NO_WRAP))
        (transactionSignature ?: signatureFromSignedTransaction(signedTransaction))?.let { json.put("transactionSignature", it) }
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
                json.optString("transactionSignature").takeIf { it.isNotBlank() } ?: signatureFromSignedTransaction(Base64.decode(json.getString("signedTransaction"), Base64.DEFAULT)),
                if (json.has("lastValidBlockHeight")) json.getLong("lastValidBlockHeight") else null,
                json.optString("quoteToken").takeIf { it.isNotBlank() }
            )
        }.getOrNull()
    }

    fun clear() { prefs.edit().remove("pending").apply() }
}
