package com.sparkd.community

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.solana.mobilewalletadapter.clientlib.ActivityResultSender

class MainActivity : ComponentActivity() {
    private lateinit var wallet: WalletSession

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        wallet = WalletSession(ActivityResultSender(this))
        setContent { ProductionApp(wallet) }
    }
}
