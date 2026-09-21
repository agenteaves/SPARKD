package com.sparkd.community

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class PreparedBurn(
    val contestId: String,
    val tokenAccount: String,
    val unsignedTransaction: ByteArray,
    val lastValidBlockHeight: Long
)

/**
 * Native counterpart to the website's read-only / prepare stages.
 * It never sends a transaction or burns tokens.
 */
class ContestBurnApi {
    private val endpoint = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler"
    private val mint = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
    private val token2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

    private suspend fun call(payload: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"; doOutput = true; connectTimeout = 15_000; readTimeout = 30_000
            setRequestProperty("Content-Type", "application/json")
        }
        connection.outputStream.use { it.write(payload.toString().toByteArray()) }
        val status = connection.responseCode
        val body = (if (status in 200..299) connection.inputStream else connection.errorStream)?.bufferedReader()?.use { it.readText() }.orEmpty()
        val result = runCatching { JSONObject(body) }.getOrElse { throw IllegalStateException("SPARKD contest service returned an invalid response.") }
        if (status !in 200..299 || !result.optBoolean("success")) throw IllegalStateException(result.optString("error", "SPARKD contest service request failed."))
        result
    }


    /** Checks the same server-side Forge record validator used by sparkdcoin.com.
     * This is read-only and never uploads or burns anything. */
    suspend fun verifyForge(wallet: String, forge: ForgeDnaRecord) {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        val data = JSONObject()
            .put("forge", forge.forge).put("version", forge.version)
            .put("memeID", forge.memeID).put("DNA", forge.DNA)
            .put("imageFingerprint", forge.imageFingerprint).put("imageLock", forge.imageLock)
            .put("created", forge.created).put("contract", forge.contract)
            .put("creatorID", forge.creatorID).put("wallet", forge.wallet)
            .put("reputation", forge.reputation).put("signature", forge.signature)
        val result = call(JSONObject().put("action", "verify_dna").put("wallet", wallet).put("mint", mint).put("forgeData", data))
        check(result.optBoolean("verified")) {
            result.optString("reason", result.optString("error", "SPARKD Forge verification failed."))
        }
    }


    /** Sends only the exact bytes returned by the wallet after user approval. */
    suspend fun sendSignedTransaction(wallet: String, contestId: String, signedTransaction: ByteArray): String {
        require(signedTransaction.isNotEmpty()) { "Signed transaction is empty." }
        val encoded = Base64.encodeToString(signedTransaction, Base64.NO_WRAP)
        val result = call(JSONObject().put("action", "send_signed_transaction")
            .put("wallet", wallet).put("contestId", contestId).put("signedTransaction", encoded))
        check(result.optBoolean("sent")) { "SPARKD server did not accept the signed transaction." }
        return result.optString("transactionSignature").takeIf { it.isNotBlank() }
            ?: error("SPARKD server returned no transaction signature.")
    }

    /** Confirms the server observed and validated the exact on-chain burn. */
    suspend fun verifyBurn(wallet: String, signature: String): Boolean {
        val result = call(JSONObject().put("action", "verify_burn").put("wallet", wallet).put("burnTransaction", signature))
        check(result.optBoolean("verified")) { result.optString("reason", "SPARKD burn could not be verified.") }
        return true
    }

    /** Checks whether this wallet already has a submission; it never changes contest state. */
    suspend fun hasExistingSubmission(wallet: String): Boolean {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        val result = call(JSONObject().put("action", "check_submission").put("wallet", wallet))
        return result.optBoolean("alreadySubmitted") || result.optBoolean("submitted") || result.optBoolean("exists")
    }

    suspend fun prepare(wallet: String, contestId: String): PreparedBurn {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        val token = call(JSONObject().put("action", "find_token_account").put("wallet", wallet))
        check(token.optBoolean("found")) { "No SPARKD Token-2022 account was found." }
        check(token.optString("mint") == mint && token.optString("program") == token2022) { "Unexpected SPARKD token account." }
        check(token.optInt("decimals") == 6 && token.optBoolean("sufficientBalance")) { "You need at least 2,000 SPARKD to enter." }
        val tokenAccount = token.getString("tokenAccount")
        val prepared = call(JSONObject().put("action", "prepare_burn").put("wallet", wallet).put("contestId", contestId).put("tokenAccount", tokenAccount))
        check(prepared.optBoolean("prepared") && prepared.optBoolean("transactionBuilt")) { "SPARKD burn could not be prepared." }
        check(prepared.optInt("signerCount") == 1 && prepared.optInt("instructionCount") == 1 && !prepared.optBoolean("durableNonce")) { "Unexpected SPARKD transaction layout." }
        check(prepared.optString("mint") == mint && prepared.optString("tokenProgram") == token2022) { "Unexpected SPARKD burn token." }
        check(prepared.optString("rawBurnAmount") == "2000000000" && prepared.optInt("decimals") == 6) { "Unexpected SPARKD burn amount." }
        val bytes = runCatching { Base64.decode(prepared.getString("unsignedTransaction"), Base64.DEFAULT) }.getOrElse { throw IllegalStateException("SPARKD server returned an invalid transaction.") }
        check(bytes.isNotEmpty()) { "SPARKD server returned an empty transaction." }
        return PreparedBurn(contestId, tokenAccount, bytes, prepared.getLong("lastValidBlockHeight"))
    }
}
