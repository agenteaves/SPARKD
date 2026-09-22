package com.sparkd.community

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import androidx.lifecycle.Lifecycle
import com.solana.mobilewalletadapter.clientlib.scenario.LocalAssociationIntentCreator
import com.solana.mobilewalletadapter.clientlib.scenario.LocalAssociationScenario
import com.solana.mobilewalletadapter.common.ProtocolContract
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

private const val JUPITER_PACKAGE = "ag.jup.jupiter.android"

class WalletSession(private val activity: Activity, private val lifecycle: Lifecycle) {
    var address: String? = null; private set
    private var walletUri: Uri? = null
    private var authToken: String? = null
    private lateinit var launcher: ActivityResultLauncher<WalletIntentParams>

    fun register(register: (ActivityResultContract<WalletIntentParams, ActivityResult>, (ActivityResult) -> Unit) -> ActivityResultLauncher<WalletIntentParams>) {
        launcher = register(WalletIntentContract()) { }
    }

    suspend fun connect(): String = withContext(Dispatchers.IO) {
        val scenario = LocalAssociationScenario(60_000)
        val intent = LocalAssociationIntentCreator.createAssociationIntent(walletUri, scenario.port, scenario.session)
            .setPackage(JUPITER_PACKAGE)
        withContext(Dispatchers.Main) { launcher.launch(WalletIntentParams(intent, CompletableDeferred())) }
        try {
            val client = scenario.start().get(60, TimeUnit.SECONDS)
            val result = client.authorize(
                Uri.parse("https://sparkdcoin.com"), Uri.parse("favicon.ico"), "SPARKD",
                ProtocolContract.CHAIN_SOLANA_MAINNET, null, null, null, null
            ).get() ?: error("Jupiter did not authorize SPARKD.")
            val account = result.accounts.firstOrNull() ?: error("Jupiter did not provide an account.")
            address = Base58.encode(account.publicKey)
            authToken = result.authToken
            walletUri = result.walletUriBase
            address!!
        } finally {
            scenario.close().get(2, TimeUnit.SECONDS)
        }
    }

    fun disconnect() {
        address = null
        authToken = null
        walletUri = null
    }

    suspend fun signTransaction(unsignedTransaction: ByteArray): ByteArray = withContext(Dispatchers.IO) {
        val token = authToken ?: error("Connect Jupiter before signing.")
        val scenario = LocalAssociationScenario(60_000)
        val intent = LocalAssociationIntentCreator.createAssociationIntent(walletUri, scenario.port, scenario.session)
            .setPackage(JUPITER_PACKAGE)
        withContext(Dispatchers.Main) { launcher.launch(WalletIntentParams(intent, CompletableDeferred())) }
        try {
            val client = scenario.start().get(60, TimeUnit.SECONDS)
            val authorization = client.reauthorize(
                Uri.parse("https://sparkdcoin.com"), Uri.parse("favicon.ico"), "SPARKD", token
            ).get() ?: error("Jupiter authorization expired. Please reconnect.")
            val account = authorization.accounts.firstOrNull() ?: error("Jupiter did not provide an account.")
            val authorizedAddress = Base58.encode(account.publicKey)
            check(authorizedAddress == address) { "The active Jupiter wallet changed. Reconnect before signing." }
            client.signTransactions(arrayOf(unsignedTransaction)).get()?.signedPayloads?.singleOrNull()
                ?: error("Jupiter did not return a signed transaction.")
        } finally {
            scenario.close().get(2, TimeUnit.SECONDS)
        }
    }
}

data class WalletIntentParams(val intent: Intent, val finished: CompletableDeferred<Unit>)
private class WalletIntentContract : ActivityResultContract<WalletIntentParams, ActivityResult>() {
    override fun createIntent(context: Context, input: WalletIntentParams): Intent = input.intent
    override fun parseResult(resultCode: Int, intent: Intent?): ActivityResult = ActivityResult(resultCode, intent)
}

private object Base58 {
    private const val alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    fun encode(input: ByteArray): String {
        if (input.isEmpty()) return ""
        val digits = IntArray(input.size * 2); var length = 1
        for (byte in input) { var carry = byte.toInt() and 0xff; for (i in 0 until length) { carry += digits[i] shl 8; digits[i] = carry % 58; carry /= 58 }; while (carry > 0) { digits[length++] = carry % 58; carry /= 58 } }
        return buildString { input.takeWhile { it.toInt() == 0 }.forEach { append('1') }; for (i in length - 1 downTo 0) append(alphabet[digits[i]]) }
    }
}
