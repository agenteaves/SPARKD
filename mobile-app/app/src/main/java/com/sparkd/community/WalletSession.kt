package com.sparkd.community

import android.net.Uri
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender
import com.solana.mobilewalletadapter.clientlib.ConnectionIdentity
import com.solana.mobilewalletadapter.clientlib.MobileWalletAdapter
import com.solana.mobilewalletadapter.clientlib.TransactionResult

class WalletSession(private val sender: ActivityResultSender) {
    var address: String? = null
        private set

    private val walletAdapter = MobileWalletAdapter(
        connectionIdentity = ConnectionIdentity(
            identityUri = Uri.parse("https://sparkdcoin.com"),
            iconUri = Uri.parse("favicon.ico"),
            identityName = "SPARKD"
        )
    )

    suspend fun connect(): String {
        return when (val result = walletAdapter.connect(sender)) {
            is TransactionResult.Success -> {
                val account = result.authResult.accounts.firstOrNull()
                    ?: error("Wallet did not provide an account.")
                Base58.encode(account.publicKey).also { address = it }
            }
            is TransactionResult.NoWalletFound -> error("No Mobile Wallet Adapter compatible wallet was found.")
            is TransactionResult.Failure -> throw result.e
        }
    }

    fun disconnect() {
        address = null
        walletAdapter.authToken = null
    }

    /**
     * Signs an already validated transaction. It deliberately does not broadcast it:
     * the SPARKD server receives these exact signed bytes, records recovery state,
     * and broadcasts/validates the receipt.
     */
    suspend fun signTransaction(unsignedTransaction: ByteArray): ByteArray {
        val expectedAddress = address ?: error("Connect your wallet before signing.")
        return when (val result = walletAdapter.transact(sender) { authResult ->
            val account = authResult.accounts.firstOrNull()
                ?: error("Wallet did not provide an account.")
            check(Base58.encode(account.publicKey) == expectedAddress) {
                "The active wallet changed. Reconnect before signing."
            }
            signTransactions(arrayOf(unsignedTransaction))
        }) {
            is TransactionResult.Success ->
                result.payload?.signedPayloads?.singleOrNull()
                    ?: error("Wallet did not return a signed transaction.")
            is TransactionResult.NoWalletFound -> error("No Mobile Wallet Adapter compatible wallet was found.")
            is TransactionResult.Failure -> throw result.e
        }
    }
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
