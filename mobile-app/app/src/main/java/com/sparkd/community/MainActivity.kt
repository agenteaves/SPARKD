package com.sparkd.community
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
class MainActivity:ComponentActivity(){
 private lateinit var wallet:WalletSession
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
  wallet=WalletSession(this,lifecycle).also { session -> session.register { contract, callback -> registerForActivityResult(contract, callback) } }
  setContent{ProductionApp(wallet)}
 }
}
