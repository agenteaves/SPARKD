package com.sparkd.community

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.UnknownHostException
import java.io.IOException
import java.util.UUID

data class PreparedBurn(
    val contestId: String,
    val tokenAccount: String,
    val unsignedTransaction: ByteArray,
    val lastValidBlockHeight: Long
)

data class TransactionStatus(val found: Boolean, val failed: Boolean)

/**
 * Native counterpart to the website's read-only / prepare stages.
 * It never sends a transaction or burns tokens.
 */
class ContestBurnApi {
    private val endpoint = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler"
    private val mint = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
    private val token2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    private val supabase = "https://uxpbgzksfizkyxubctep.supabase.co"
    private val publishableKey = "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J"
    private val bucket = "sparkd-contest-submissions"

    private suspend fun call(payload: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        var lastNetworkError: IOException? = null
        repeat(3) { attempt ->
            try {
                val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"; doOutput = true; connectTimeout = 15_000; readTimeout = 30_000
                    setRequestProperty("Content-Type", "application/json")
                }
                try {
                    connection.outputStream.use { it.write(payload.toString().toByteArray()) }
                    val status = connection.responseCode
                    val body = (if (status in 200..299) connection.inputStream else connection.errorStream)
                        ?.bufferedReader()?.use { it.readText() }.orEmpty()
                    val result = runCatching { JSONObject(body) }
                        .getOrElse { throw IllegalStateException("SPARKD contest service returned an invalid response.") }
                    if (status !in 200..299 || !result.optBoolean("success")) {
                        throw IllegalStateException(result.optString("error", "SPARKD contest service request failed."))
                    }
                    return@withContext result
                } finally {
                    connection.disconnect()
                }
            } catch (e: UnknownHostException) {
                lastNetworkError = e
            } catch (e: IOException) {
                lastNetworkError = e
            }
            if (attempt < 2) kotlinx.coroutines.delay(700L * (attempt + 1))
        }
        throw IllegalStateException(
            "SPARKD contest service is temporarily unreachable. Check your connection and tap Review secure entry again.",
            lastNetworkError
        )
    }


    private fun forgeJson(forge: ForgeDnaRecord) = JSONObject()
        .put("forge", forge.forge).put("version", forge.version)
        .put("memeID", forge.memeID).put("DNA", forge.DNA)
        .put("imageFingerprint", forge.imageFingerprint).put("imageLock", forge.imageLock)
        .put("created", forge.created).put("contract", forge.contract)
        .put("creatorID", forge.creatorID).put("wallet", forge.wallet)
        .put("reputation", forge.reputation).put("signature", forge.signature)

    suspend fun uploadMeme(wallet: String, contestId: String, png: ByteArray): String = withContext(Dispatchers.IO) {
        require(png.isNotEmpty() && png.size <= 10 * 1024 * 1024) { "Contest PNG must be 10 MB or smaller." }
        val path = "$contestId/${wallet.take(12)}-${System.currentTimeMillis()}.png"
        val connection = (URL("$supabase/storage/v1/object/$bucket/$path").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"; doOutput = true; connectTimeout = 15_000; readTimeout = 30_000
            setRequestProperty("Content-Type", "image/png")
            setRequestProperty("apikey", publishableKey)
            setRequestProperty("Authorization", "Bearer $publishableKey")
            setRequestProperty("x-upsert", "false")
        }
        try {
            connection.outputStream.use { it.write(png) }
            val code = connection.responseCode
            if (code !in 200..299) {
                val body = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                val message = runCatching { JSONObject(body).optString("message") }.getOrNull()
                throw IllegalStateException(message?.takeIf { it.isNotBlank() } ?: "SPARKD meme upload failed (HTTP $code).")
            }
            path
        } finally {
            connection.disconnect()
        }
    }

    suspend fun getBurnReceipt(wallet: String, contestId: String): String? {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        require(contestId.isNotBlank()) { "Contest ID is required." }
        val result = call(JSONObject().put("action", "get_burn_receipt")
            .put("wallet", wallet).put("contestId", contestId))
        val candidates = listOf(
            result.optString("burnTransaction"),
            result.optString("transactionSignature"),
            result.optJSONObject("receipt")?.optString("burnTransaction").orEmpty(),
            result.optJSONObject("receipt")?.optString("transactionSignature").orEmpty()
        )
        return candidates.firstOrNull { it.isNotBlank() }
    }

    suspend fun recordBurnReceipt(wallet: String, contestId: String, signature: String) {
        val result = call(JSONObject().put("action", "record_burn_receipt")
            .put("wallet", wallet).put("contestId", contestId).put("burnTransaction", signature))
        check(result.optBoolean("recorded") && result.optBoolean("verified")) {
            result.optString("error", "Unable to record verified SPARKD burn receipt.")
        }
    }

    suspend fun finalizeSubmission(
        wallet: String, prepared: PreparedBurn, signature: String, forge: ForgeDnaRecord,
        title: String, imagePath: String
    ) {
        val result = call(JSONObject().put("action", "finalize_submission")
            .put("wallet", wallet)
            .put("contestId", prepared.contestId)
            .put("burnTransaction", signature)
            .put("submissionId", UUID.randomUUID().toString())
            .put("creatorId", forge.creatorID)
            .put("memeTitle", title.ifBlank { "Untitled SPARKD Meme" })
            .put("memeImageUrl", imagePath)
            .put("dnaVerificationData", forgeJson(forge)))
        check(result.optBoolean("finalized")) {
            result.optString("error", "Unable to finalize SPARKD contest submission.")
        }
    }


    /** Checks the same server-side Forge record validator used by sparkdcoin.com.
     * This is read-only and never uploads or burns anything. */
    suspend fun verifyForge(wallet: String, forge: ForgeDnaRecord) {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        val data = forgeJson(forge)
        val result = call(JSONObject().put("action", "verify_dna").put("wallet", wallet).put("mint", mint).put("forgeData", data))
        check(result.optBoolean("verified")) {
            result.optString("reason", result.optString("error", "SPARKD Forge verification failed."))
        }
    }


    /** Sends only the exact bytes returned by the wallet after user approval. */
    suspend fun sendSignedTransaction(wallet: String, contestId: String, signedTransaction: ByteArray, expectedUnsignedTransaction: ByteArray, recovery: BurnRecoveryStore): String {
        validateSignedLegacyTransaction(signedTransaction)
        // Phantom may normalize the transaction envelope while signing. The backend receives
        // only the wallet-signed bytes and remains the broadcast gate; on-chain verify_burn
        // must prove the expected wallet/mint/amount before a receipt or submission is recorded.
        recovery.save(contestId, wallet, signedTransaction, lastValidBlockHeight = null)
        val encoded = Base64.encodeToString(signedTransaction, Base64.NO_WRAP)
        val result = call(JSONObject().put("action", "send_signed_transaction")
            .put("wallet", wallet).put("contestId", contestId).put("signedTransaction", encoded))
        check(result.optBoolean("sent")) { "SPARKD server did not accept the signed transaction." }
        val signature = result.optString("transactionSignature").takeIf { it.isNotBlank() }
            ?: error("SPARKD server returned no transaction signature.")
        return signature
    }

    private fun validateSignedLegacyTransaction(bytes: ByteArray) {
        val (signatureCount, prefixSize) = decodeShortVec(bytes)
        check(signatureCount == 1) { "Unexpected signed transaction format." }
        val signatureStart = prefixSize
        val signatureEnd = signatureStart + 64
        check(bytes.size > signatureEnd) { "Unexpected signed transaction format." }
        check(bytes.copyOfRange(signatureStart, signatureEnd).any { it.toInt() != 0 }) {
            "Wallet returned an empty signature."
        }
    }

    /**
     * MWA wallets may normalize the serialized transaction envelope while signing.
     * Security comparison must therefore compare the exact Solana message (accounts,
     * blockhash and instruction data), not assume both envelopes are byte-identical
     * after a hard-coded 65-byte offset.
     */
    private fun walletSignedOnlyReviewedTransaction(reviewed: ByteArray, signed: ByteArray): Boolean {
        // MWA signTransactions returns the serialized transaction with the wallet signature
        // populated. For a one-signer legacy transaction, the only permitted mutation is the
        // 64-byte signature slot itself. Compare the parsed message first, then fall back to
        // masking that slot in both envelopes. This accepts Phantom's valid serialization while
        // still rejecting any account, blockhash, instruction, amount or program mutation.
        val reviewedMessage = runCatching { serializedTransactionMessage(reviewed) }.getOrNull()
        val signedMessage = runCatching { serializedTransactionMessage(signed) }.getOrNull()
        if (reviewedMessage != null && signedMessage != null && signedMessage.contentEquals(reviewedMessage)) {
            return true
        }

        val reviewedLayout = runCatching { signatureLayout(reviewed) }.getOrNull() ?: return false
        val signedLayout = runCatching { signatureLayout(signed) }.getOrNull() ?: return false
        if (reviewedLayout.first != 1 || signedLayout.first != 1) return false

        val reviewedCopy = reviewed.copyOf()
        val signedCopy = signed.copyOf()
        reviewedCopy.fill(0, reviewedLayout.second, reviewedLayout.second + 64)
        signedCopy.fill(0, signedLayout.second, signedLayout.second + 64)
        return reviewedCopy.contentEquals(signedCopy)
    }

    private fun signatureLayout(bytes: ByteArray): Pair<Int, Int> {
        val (count, prefixSize) = decodeShortVec(bytes)
        check(prefixSize + count * 64 < bytes.size) { "Unexpected transaction serialization." }
        return count to prefixSize
    }

    private fun serializedTransactionMessage(bytes: ByteArray): ByteArray {
        val (signatureCount, prefixSize) = decodeShortVec(bytes)
        val messageOffset = prefixSize + signatureCount * 64
        check(messageOffset in 1 until bytes.size) { "Unexpected transaction serialization." }
        return bytes.copyOfRange(messageOffset, bytes.size)
    }

    private fun decodeShortVec(bytes: ByteArray): Pair<Int, Int> {
        require(bytes.isNotEmpty()) { "Empty transaction serialization." }
        var value = 0
        var shift = 0
        var index = 0
        while (index < bytes.size && index < 3) {
            val b = bytes[index].toInt() and 0xff
            value = value or ((b and 0x7f) shl shift)
            index++
            if ((b and 0x80) == 0) return value to index
            shift += 7
        }
        error("Invalid transaction signature-count encoding.")
    }

    suspend fun transactionStatus(wallet: String, signature: String): TransactionStatus {
        val result = call(JSONObject().put("action", "check_transaction_status")
            .put("wallet", wallet).put("transactionSignature", signature))
        return TransactionStatus(result.optBoolean("found"), result.has("err") && !result.isNull("err"))
    }

    suspend fun currentBlockHeight(wallet: String): Long {
        val result = call(JSONObject().put("action", "get_block_height").put("wallet", wallet))
        return result.getLong("blockHeight")
    }

    suspend fun resendSignedTransaction(wallet: String, contestId: String, signedTransaction: ByteArray): String {
        validateSignedLegacyTransaction(signedTransaction)
        val result = call(JSONObject().put("action", "send_signed_transaction")
            .put("wallet", wallet).put("contestId", contestId)
            .put("signedTransaction", Base64.encodeToString(signedTransaction, Base64.NO_WRAP)))
        check(result.optBoolean("sent")) { "SPARKD server did not accept the saved signed transaction." }
        return result.optString("transactionSignature").takeIf { it.isNotBlank() }
            ?: error("SPARKD server returned no transaction signature.")
    }

    /** Confirms the server observed and validated the exact on-chain burn. */
    suspend fun verifyBurn(wallet: String, signature: String): Boolean {
        repeat(15) { attempt ->
            val result = call(JSONObject().put("action", "verify_burn").put("wallet", wallet).put("burnTransaction", signature))
            if (result.optBoolean("verified")) return true
            if (result.optBoolean("transactionFound")) {
                error(result.optString("reason", "The transaction was found but the SPARKD burn could not be verified."))
            }
            if (attempt < 14) kotlinx.coroutines.delay(1000)
        }
        error("The burn was sent but is not confirmed yet. DO NOT BURN AGAIN. Retry this submission to recover it.")
    }

    /** Checks whether this wallet already has a submission; it never changes contest state. */
    suspend fun hasExistingSubmission(wallet: String): Boolean {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        val result = call(JSONObject().put("action", "check_submission").put("wallet", wallet))
        return result.optBoolean("alreadySubmitted") || result.optBoolean("submitted") || result.optBoolean("exists")
    }

    suspend fun prepare(wallet: String, contestId: String, creatorId: String): PreparedBurn {
        require(wallet.length in 32..50) { "Invalid wallet address." }
        require(creatorId.isNotBlank()) { "Creator identity is missing from this Forge export." }
        val token = call(JSONObject().put("action", "find_token_account").put("wallet", wallet))
        check(token.optBoolean("found")) { "No SPARKD Token-2022 account was found." }
        check(token.optString("mint") == mint && token.optString("program") == token2022) { "Unexpected SPARKD token account." }
        check(token.optInt("decimals") == 6 && token.optBoolean("sufficientBalance")) { "You need at least 2,000 SPARKD to enter." }
        val tokenAccount = token.getString("tokenAccount")
        val prepared = call(JSONObject().put("action", "prepare_burn").put("wallet", wallet).put("contestId", contestId).put("tokenAccount", tokenAccount).put("creatorId", creatorId))
        check(prepared.optBoolean("prepared") && prepared.optBoolean("transactionBuilt")) { "SPARKD burn could not be prepared." }
        check(prepared.optInt("signerCount") == 1 && prepared.optInt("instructionCount") == 1 && !prepared.optBoolean("durableNonce")) { "Unexpected SPARKD transaction layout." }
        check(prepared.optString("mint") == mint && prepared.optString("tokenProgram") == token2022) { "Unexpected SPARKD burn token." }
        check(prepared.optString("rawBurnAmount") == "2000000000" && prepared.optInt("decimals") == 6) { "Unexpected SPARKD burn amount." }
        val bytes = runCatching { Base64.decode(prepared.getString("unsignedTransaction"), Base64.DEFAULT) }.getOrElse { throw IllegalStateException("SPARKD server returned an invalid transaction.") }
        check(bytes.isNotEmpty()) { "SPARKD server returned an empty transaction." }
        return PreparedBurn(contestId, tokenAccount, bytes, prepared.getLong("lastValidBlockHeight"))
    }
}
