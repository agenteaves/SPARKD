package com.sparkd.community

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.net.UnknownHostException
import java.util.UUID

data class PreparedBurn(val contestId: String, val tokenAccount: String, val unsignedTransaction: ByteArray, val lastValidBlockHeight: Long)
data class TransactionStatus(val found: Boolean, val failed: Boolean)

class ContestBurnApi {
    private val endpoint = "https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/super-handler"
    private val mint = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump"
    private val token2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    private val supabase = "https://uxpbgzksfizkyxubctep.supabase.co"
    private val publishableKey = "sb_publishable_wf4FFwp5uV0ppQ140WE6NA_TzNQzl2J"
    private val bucket = "sparkd-contest-submissions"
    @Volatile private var activeMemeId: String? = null
    private fun requireMemeId(): String = activeMemeId?.takeIf { it.isNotBlank() } ?: error("Verify the SPARKD Forge export before preparing or recovering a contest burn.")

    private suspend fun call(payload: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        var lastNetworkError: IOException? = null
        repeat(3) { attempt ->
            try {
                val connection=(URL(endpoint).openConnection() as HttpURLConnection).apply{requestMethod="POST";doOutput=true;connectTimeout=15_000;readTimeout=30_000;setRequestProperty("Content-Type","application/json")}
                try { connection.outputStream.use{it.write(payload.toString().toByteArray())};val status=connection.responseCode;val body=(if(status in 200..299)connection.inputStream else connection.errorStream)?.bufferedReader()?.use{it.readText()}.orEmpty();val result=runCatching{JSONObject(body)}.getOrElse{throw IllegalStateException("SPARKD contest service returned an invalid response.")};if(status !in 200..299||!result.optBoolean("success"))throw IllegalStateException(result.optString("error","SPARKD contest service request failed."));return@withContext result } finally { connection.disconnect() }
            } catch(e:UnknownHostException){lastNetworkError=e}catch(e:IOException){lastNetworkError=e}
            if(attempt<2)delay(700L*(attempt+1))
        }
        throw IllegalStateException("SPARKD contest service is temporarily unreachable. Check your connection and tap Review secure entry again.",lastNetworkError)
    }

    private fun forgeJson(forge: ForgeDnaRecord): JSONObject {
        val json=JSONObject().put("forge",forge.forge).put("version",forge.version).put("memeID",forge.memeID).put("DNA",forge.DNA).put("imageFingerprint",forge.imageFingerprint).put("imageLock",forge.imageLock).put("created",forge.created).put("contract",forge.contract).put("creatorID",forge.creatorID).put("wallet",forge.wallet).put("reputation",forge.reputation)
        forge.pngFingerprint?.let{json.put("pngFingerprint",it)}
        forge.pngSignature?.let{json.put("pngSignature",it)}
        return json.put("signature",forge.signature)
    }

    suspend fun uploadMeme(wallet:String,contestId:String,png:ByteArray):String=withContext(Dispatchers.IO){require(png.isNotEmpty()&&png.size<=10*1024*1024){"Contest PNG must be 10 MB or smaller."};val path="$contestId/${wallet.take(12)}-${System.currentTimeMillis()}.png";val connection=(URL("$supabase/storage/v1/object/$bucket/$path").openConnection() as HttpURLConnection).apply{requestMethod="POST";doOutput=true;connectTimeout=15_000;readTimeout=30_000;setRequestProperty("Content-Type","image/png");setRequestProperty("apikey",publishableKey);setRequestProperty("Authorization","Bearer $publishableKey");setRequestProperty("x-upsert","false")};try{connection.outputStream.use{it.write(png)};val code=connection.responseCode;if(code !in 200..299){val body=connection.errorStream?.bufferedReader()?.use{it.readText()}.orEmpty();val message=runCatching{JSONObject(body).optString("message")}.getOrNull();throw IllegalStateException(message?.takeIf{it.isNotBlank()}?:"SPARKD meme upload failed (HTTP $code).")};path}finally{connection.disconnect()}}
    suspend fun getBurnReceipt(wallet:String,contestId:String):String?{require(wallet.length in 32..50);val result=call(JSONObject().put("action","get_burn_receipt").put("wallet",wallet).put("contestId",contestId).put("memeID",requireMemeId()));val receipt=result.optJSONObject("receipt");val signature=listOf(result.optString("burn_transaction"),result.optString("burnTransaction"),result.optString("transaction_signature"),result.optString("transactionSignature"),receipt?.optString("burn_transaction").orEmpty(),receipt?.optString("burnTransaction").orEmpty(),receipt?.optString("transaction_signature").orEmpty(),receipt?.optString("transactionSignature").orEmpty()).firstOrNull{it.isNotBlank()};return signature?.takeIf{result.optBoolean("found",true)&&result.optBoolean("verified",true)}}
    suspend fun recordBurnReceipt(wallet:String,contestId:String,signature:String){val r=call(JSONObject().put("action","record_burn_receipt").put("wallet",wallet).put("contestId",contestId).put("memeID",requireMemeId()).put("burnTransaction",signature));check(r.optBoolean("recorded")&&r.optBoolean("verified")){r.optString("error","Unable to record verified SPARKD burn receipt.")}}
    suspend fun finalizeSubmission(wallet:String,prepared:PreparedBurn,signature:String,forge:ForgeDnaRecord,title:String,imagePath:String){check(forge.memeID==requireMemeId());val r=call(JSONObject().put("action","finalize_submission").put("wallet",wallet).put("contestId",prepared.contestId).put("memeID",forge.memeID).put("burnTransaction",signature).put("submissionId",UUID.randomUUID().toString()).put("creatorId",forge.creatorID).put("memeTitle",title.ifBlank{"Untitled SPARKD Meme"}).put("memeImageUrl",imagePath).put("dnaVerificationData",forgeJson(forge)));check(r.optBoolean("finalized")){r.optString("error","Unable to finalize SPARKD contest submission.")}}
    suspend fun verifyForge(wallet:String,forge:ForgeDnaRecord){require(wallet.length in 32..50);val data=forgeJson(forge);if(data.optString("wallet")=="NOT_CONNECTED")data.put("wallet",wallet);val r=call(JSONObject().put("action","verify_dna").put("wallet",wallet).put("mint",mint).put("forgeData",data));check(r.optBoolean("verified")){r.optString("reason",r.optString("error","SPARKD Forge verification failed."))};activeMemeId=forge.memeID}
    suspend fun sendSignedTransaction(wallet:String,contestId:String,signedTransaction:ByteArray,expectedUnsignedTransaction:ByteArray,recovery:BurnRecoveryStore):String{validateSignedLegacyTransaction(signedTransaction);recovery.save(contestId,wallet,signedTransaction,lastValidBlockHeight=null);val r=call(JSONObject().put("action","send_signed_transaction").put("wallet",wallet).put("contestId",contestId).put("memeID",requireMemeId()).put("signedTransaction",Base64.encodeToString(signedTransaction,Base64.NO_WRAP)));check(r.optBoolean("sent"));return r.optString("transactionSignature").takeIf{it.isNotBlank()}?:error("SPARKD server returned no transaction signature.")}
    private fun validateSignedLegacyTransaction(bytes:ByteArray){val(signatureCount,prefixSize)=decodeShortVec(bytes);check(signatureCount==1);val signatureEnd=prefixSize+64;check(bytes.size>signatureEnd);check(bytes.copyOfRange(prefixSize,signatureEnd).any{it.toInt()!=0})}
    private fun decodeShortVec(bytes:ByteArray):Pair<Int,Int>{require(bytes.isNotEmpty());var value=0;var shift=0;var index=0;while(index<bytes.size&&index<3){val b=bytes[index].toInt()and 0xff;value=value or((b and 0x7f)shl shift);index++;if((b and 0x80)==0)return value to index;shift+=7};error("Invalid transaction signature-count encoding.")}
    suspend fun transactionStatus(wallet:String,signature:String):TransactionStatus{val r=call(JSONObject().put("action","check_transaction_status").put("wallet",wallet).put("transactionSignature",signature));return TransactionStatus(r.optBoolean("found"),r.has("err")&&!r.isNull("err"))}
    suspend fun currentBlockHeight(wallet:String):Long=call(JSONObject().put("action","get_block_height").put("wallet",wallet)).getLong("blockHeight")
    suspend fun resendSignedTransaction(wallet:String,contestId:String,signedTransaction:ByteArray):String{validateSignedLegacyTransaction(signedTransaction);val r=call(JSONObject().put("action","send_signed_transaction").put("wallet",wallet).put("contestId",contestId).put("memeID",requireMemeId()).put("signedTransaction",Base64.encodeToString(signedTransaction,Base64.NO_WRAP)));check(r.optBoolean("sent"));return r.optString("transactionSignature").takeIf{it.isNotBlank()}?:error("SPARKD server returned no transaction signature.")}
    suspend fun verifyBurn(wallet:String,signature:String):Boolean{repeat(15){attempt->val r=call(JSONObject().put("action","verify_burn").put("wallet",wallet).put("memeID",requireMemeId()).put("burnTransaction",signature));if(r.optBoolean("verified"))return true;if(r.optBoolean("transactionFound"))error(r.optString("reason","The transaction was found but the SPARKD burn could not be verified."));if(attempt<14)delay(1000)};error("The burn was sent but is not confirmed yet. DO NOT BURN AGAIN. Retry this submission to recover it.")}
    suspend fun hasExistingSubmission(wallet:String):Boolean{val r=call(JSONObject().put("action","check_submission").put("wallet",wallet));return r.optBoolean("alreadySubmitted")||r.optBoolean("submitted")||r.optBoolean("exists")||r.optInt("submissionCount",0)>0}
    suspend fun prepare(wallet:String,contestId:String,creatorId:String):PreparedBurn{require(wallet.length in 32..50);val memeId=requireMemeId();val token=call(JSONObject().put("action","find_token_account").put("wallet",wallet));check(token.optBoolean("found")){"No SPARKD Token-2022 account was found."};check(token.optString("mint")==mint&&token.optString("program")==token2022);check(token.optInt("decimals")==6&&token.optBoolean("sufficientBalance")){"You need at least 2,000 SPARKD to enter."};val tokenAccount=token.getString("tokenAccount");val p=call(JSONObject().put("action","prepare_burn").put("wallet",wallet).put("contestId",contestId).put("memeID",memeId).put("tokenAccount",tokenAccount).put("creatorId",creatorId));check(p.optBoolean("prepared")&&p.optBoolean("transactionBuilt"));check(p.optInt("signerCount")==1&&p.optInt("instructionCount")==1&&!p.optBoolean("durableNonce"));check(p.optString("mint")==mint&&p.optString("tokenProgram")==token2022);check(p.optString("rawBurnAmount")=="2000000000"&&p.optInt("decimals")==6);val bytes=Base64.decode(p.getString("unsignedTransaction"),Base64.DEFAULT);return PreparedBurn(contestId,tokenAccount,bytes,p.getLong("lastValidBlockHeight"))}
}
