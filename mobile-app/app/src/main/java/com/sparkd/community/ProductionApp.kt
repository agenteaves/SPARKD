package com.sparkd.community

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun ProductionApp(wallet: WalletSession) {
    val repo = remember { LiveRepository() }
    var page by remember { mutableStateOf("home") }
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("SPARKD", fontWeight = FontWeight.Black) }) }) { padding ->
        when (page) {
            "forge" -> Box(Modifier.padding(padding)) { Forge() }
            "contest" -> Box(Modifier.padding(padding)) { Contest(repo) }
            else -> LiveHome(Modifier.padding(padding), repo, wallet, { page = it })
        }
    }
}

@Composable private fun LiveHome(modifier: Modifier, repo: LiveRepository, wallet: WalletSession, go: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var contest by remember { mutableStateOf<Contest?>(null) }
    var walletAddress by remember { mutableStateOf(wallet.address) }
    var message by remember { mutableStateOf("Loading the live SPARKD contest…") }
    LaunchedEffect(Unit) { runCatching { repo.contest() }.onSuccess { contest = it; message = "" }.onFailure { message = it.message ?: "Unable to load the contest." } }
    LazyColumn(modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Create. Enter. Vote. Win.", fontSize = 30.sp, fontWeight = FontWeight.Black) }
        item { Text(if (walletAddress == null) "Connect your Solana wallet to participate." else "Wallet connected: " + walletAddress!!.take(6) + "…" + walletAddress!!.takeLast(4)) }
        item { Card { Column(Modifier.padding(18.dp)) { Text(contest?.phase ?: "LIVE", fontWeight = FontWeight.Bold); Text(contest?.title ?: message, fontSize = 23.sp, fontWeight = FontWeight.Black); contest?.let { Text(it.prize) } } } }
        item { Button({ go("forge") }, Modifier.fillMaxWidth()) { Text("🔥 Open Meme Forge") } }
        item { Button({ go("contest") }, Modifier.fillMaxWidth()) { Text("🗳 View live contenders") } }
        item { OutlinedButton({ scope.launch { message = "Opening your Solana wallet…"; runCatching { wallet.connect() }.onSuccess { walletAddress = it; message = "Wallet connected." }.onFailure { message = it.message ?: "Wallet connection failed." } } }, Modifier.fillMaxWidth()) { Text(if (walletAddress == null) "Connect Solana Wallet" else "Reconnect Solana Wallet") } }
        if (message.isNotBlank()) item { Text(message) }
    }
}
