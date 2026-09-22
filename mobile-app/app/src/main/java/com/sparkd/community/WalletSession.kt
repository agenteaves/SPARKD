package com.sparkd.community

import android.net.Uri
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender
import com.solana.mobilewalletadapter.clientlib.ConnectionIdentity
import com.solana.mobilewalletadapter.clientlib.MobileWalletAdapter
import com.solana.mobilewalletadapter.clientlib.Solana
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
    ).apply {
        blockchain = Solana.Mainnet
    }

    suspend fun connect(): String {
        return when (val result = walletAdapter.connect(sender)) {
            is TransactionResult.Success -> {
                val account = result.authResult.accounts.firstOrNull()
                    ?: error("Wallet did not provide an account.")
                walletAdapter.authToken = result.authResult.authToken
                Base58.encode(account.publicKey).also { address = it }
            }
            is TransactionResult.NoWalletFound ->
                error("No compatible Solana wallet was found. Install a Mobile Wallet Adapter compatible wallet and try again.")
            is TransactionResult.Failure -> throw result.e
        }
    }

    fun disconnect() {
        address = null
        walletAdapter.authToken = null
    }

    suspend fun signTransaction(unsignedTransaction: ByteArray): ByteArray {
        val expectedAddress = address ?: error("Connect your wallet before signing.")

        // Start the signing association without carrying a previous authorization handle.
        // Phantom has been observed accepting reauthorization and immediately returning to
        // SPARKD before presenting the transaction approval UI. A fresh authorization here
        // keeps authorize + signTransactions in the same MWA session.
        walletAdapter.authToken = null

        return when (val result = walletAdapter.transact(sender) { authResult ->
            val account = authResult.accounts.firstOrNull()
                ?: error("Wallet did not provide an account.")
            check(Base58.encode(account.publicKey) == expectedAddress) {
                "The active wallet changed. Reconnect before signing."
            }
            val signed = signTransactions(arrayOf(unsignedTransaction)).signedPayloads.singleOrNull()
                ?: error("Wallet did not return a signed transaction.")
            Pair(authResult.authToken, signed)
        }) {
            is TransactionResult.Success -> {
                val payload = result.payload
                    ?: error("Wallet returned without a signed transaction. No SPARKD was burned.")
                walletAdapter.authToken = payload.first
                payload.second
            }
            is TransactionResult.NoWalletFound ->
                error("No compatible Solana wallet was found. Install a Mobile Wallet Adapter compatible wallet and try again.")
            is TransactionResult.Failure ->
                throw IllegalStateException(
                    "Wallet signing was cancelled or closed before approval. No SPARKD was burned. Unlock Phantom and try again.",
                    result.e
                )
        }
    }
}

private object Base58 {
    private const val alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    fun encode(input: ByteArray): String {
        if (input.isEmpty()) return ""
        val digits = IntArray(input.size * 2); var length = 1
        for (byte in input) {
            var carry = byte.toInt() and 0xff
            for (i in 0 until length) {
                carry += digits[i] shl 8
                digits[i] = carry % 58
                carry /= 58
            }
            while (carry > 0) {
                digits[length++] = carry % 58
                carry /= 58
            }
        }
        return buildString {
            input.takeWhile { it.toInt() == 0 }.forEach { append('1') }
            for (i in length - 1 downTo 0) append(alphabet[digits[i]])
        }
    }
}
