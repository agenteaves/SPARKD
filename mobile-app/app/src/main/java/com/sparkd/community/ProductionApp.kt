package com.sparkd.community

import android.graphics.BitmapFactory
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun ProductionApp(wallet: WalletSession) {
    val repo = remember { LiveRepository() }
    val context = LocalContext.current
    var availableUpdate by remember { mutableStateOf<AppUpdate?>(null) }
    LaunchedEffect(Unit) {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val installedVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            packageInfo.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            packageInfo.versionCode.toLong()
        }
        runCatching { AppUpdateRepository().latest() }
            .onSuccess { latest ->
                if (latest != null && latest.versionCode.toLong() > installedVersionCode) availableUpdate = latest
            }
    }
    var page by remember { mutableStateOf("home") }
    val goHome = { page = "home" }
    BackHandler(enabled = page != "home") { goHome() }

    availableUpdate?.let { update ->
        AlertDialog(
            onDismissRequest = { availableUpdate = null },
            title = { Text("SPARKD update available") },
            text = { Text("Version ${update.versionName} is ready. Update to get the latest fixes and contest features.") },
            confirmButton = {
                Button(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(update.downloadUrl)))
                }) { Text("Update now") }
            },
            dismissButton = {
                TextButton(onClick = { availableUpdate = null }) { Text("Later") }
            }
        )
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                navigationIcon = {
                    if (page != "home") IconButton(onClick = goHome) {
                        Icon(Icons.Default.ArrowBack, "Back to home")
                    }
                },
                title = { Text("SPARKD", fontWeight = FontWeight.Black) }
            )
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { tab ->
                    val route = when (tab) {
                        Tab.Home -> "home"; Tab.Forge -> "forge"; Tab.Contest -> "contest"
                        Tab.Winners -> "winners"; Tab.Profile -> "profile"
                    }
                    val icon = when (tab) {
                        Tab.Home -> Icons.Default.Home; Tab.Forge -> Icons.Default.Edit
                        Tab.Contest -> Icons.Default.EmojiEvents; Tab.Winners -> Icons.Default.WorkspacePremium
                        Tab.Profile -> Icons.Default.Person
                    }
                    NavigationBarItem(
                        selected = page == route,
                        onClick = { page = route },
                        icon = { Icon(icon, tab.label) },
                        label = { Text(tab.label) }
                    )
                }
                NavigationBarItem(
                    selected = page == "submit",
                    onClick = { page = "submit" },
                    icon = { Icon(Icons.Default.UploadFile, "Submit") },
                    label = { Text("Submit") }
                )
            }
        }
    ) { padding ->
        when (page) {
            "forge" -> Box(Modifier.padding(padding)) { Forge(wallet) { page = "entry" } }
            "contest" -> Box(Modifier.padding(padding)) { Contest(repo) }
            "submit" -> Box(Modifier.padding(padding)) { SubmitMeme(wallet) { page = "entry" } }
            "winners" -> Box(Modifier.padding(padding)) { Winners(repo) }
            "profile" -> Box(Modifier.padding(padding)) { Profile(wallet) }
            "entry" -> Box(Modifier.padding(padding)) { ContestEntry(wallet, repo) }
            else -> LiveHome(Modifier.padding(padding), repo, wallet) { page = it }
        }
    }
}

@Composable private fun LiveHome(modifier: Modifier, repo: LiveRepository, wallet: WalletSession, go: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var contest by remember { mutableStateOf<Contest?>(null) }
    var walletAddress by remember { mutableStateOf(wallet.address) }
    var message by remember { mutableStateOf("Loading the live SPARKD contest…") }
    LaunchedEffect(Unit) {
        while (isActive) {
            runCatching { repo.contest() }
                .onSuccess { contest = it; message = "" }
                .onFailure {
                    // Keep the last successfully loaded contest on transient network/DNS failures.
                    // Avoid exposing low-level host/network errors to users.
                    if (contest == null) message = "Live contest data is temporarily unavailable. Retrying automatically…"
                }
            delay(15_000)
        }
    }
    LazyColumn(modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Create. Enter. Vote. Win.", fontSize = 30.sp, fontWeight = FontWeight.Black) }
        item { Text(if (walletAddress == null) "Connect your Solana wallet to participate." else "Wallet connected: " + walletAddress!!.take(6) + "…" + walletAddress!!.takeLast(4)) }
        item { Card { Column(Modifier.padding(18.dp)) {
            Text(contest?.phase ?: "LIVE", fontWeight = FontWeight.Bold)
            Text(contest?.title ?: message, fontSize = 23.sp, fontWeight = FontWeight.Black)
            contest?.let { Text(it.prize) }
        } } }
        item { Button({ go("forge") }, Modifier.fillMaxWidth()) { Text("🔥 Open Meme Forge") } }
        item { Button({ go("contest") }, Modifier.fillMaxWidth()) { Text("🗳 View live contenders") } }
        item { OutlinedButton({ go("submit") }, Modifier.fillMaxWidth()) { Text("📤 Submit exported meme") } }
        item {
            OutlinedButton({
                if (walletAddress != null) {
                    wallet.disconnect()
                    walletAddress = null
                    message = "Wallet disconnected."
                } else scope.launch {
                    message = "Opening your Solana wallet…"
                    runCatching { wallet.connect() }
                        .onSuccess { walletAddress = it; message = "Wallet connected." }
                        .onFailure { message = it.message ?: "Wallet connection failed." }
                }
            }, Modifier.fillMaxWidth()) {
                Text(if (walletAddress == null) "Connect Solana Wallet" else "Disconnect Wallet")
            }
        }
        if (message.isNotBlank()) item { Text(message) }
    }
}

@Composable private fun SubmitMeme(wallet: WalletSession, onReady: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var title by remember { mutableStateOf(ForgeDraft.submissionTitle) }
    var selectedPng by remember { mutableStateOf(ForgeDraft.exportedPng) }
    var record by remember { mutableStateOf(ForgeDraft.exportedRecord) }
    var status by remember { mutableStateOf(if (record == null) "Choose the exact PNG exported from SPARKD Meme Forge." else "Verified SPARKD Forge PNG selected.") }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) scope.launch {
            status = "Verifying SPARKD Forge DNA and image pixels…"
            runCatching {
                val bytes = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        ?: error("Unable to read the selected PNG.")
                }
                val verified = withContext(Dispatchers.Default) { ForgeDna.extractAndVerify(bytes) }
                bytes to verified
            }.onSuccess { (bytes, verified) ->
                selectedPng = bytes
                record = verified
                ForgeDraft.exportedPng = bytes
                ForgeDraft.exportedRecord = verified
                status = "Verified SPARKD Forge PNG selected."
            }.onFailure {
                selectedPng = null
                record = null
                status = it.message ?: "This PNG did not pass SPARKD Forge verification."
            }
        }
    }

    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Submit a Meme", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item { Text("Select the same PNG you exported from the mobile Forge. Its embedded Forge DNA and image pixels will be verified before contest entry.") }
        item { OutlinedTextField(title, { title = it.take(80) }, label = { Text("Meme title") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item { Button({ picker.launch("image/png") }, Modifier.fillMaxWidth()) { Text("Choose exported SPARKD PNG") } }
        selectedPng?.let { bytes ->
            item {
                val bitmap = remember(bytes) { BitmapFactory.decodeByteArray(bytes, 0, bytes.size) }
                bitmap?.let { Image(it.asImageBitmap(), "Selected exported meme", Modifier.fillMaxWidth()) }
            }
        }
        item { Text(status, color = if (record != null) Green else Gold) }
        record?.let { forge ->
            item { Card { Column(Modifier.padding(16.dp)) {
                Text("Forge verification passed", fontWeight = FontWeight.Bold, color = Green)
                Text("Meme ID: " + forge.memeID)
                Text("Export wallet: " + if (forge.wallet == "NOT_CONNECTED") "Not connected during export" else forge.wallet.take(6) + "…" + forge.wallet.takeLast(4))
            } } }
        }
        item {
            Button({
                ForgeDraft.submissionTitle = title.trim()
                onReady()
            }, Modifier.fillMaxWidth(), enabled = record != null && selectedPng != null && title.isNotBlank()) {
                Text("Continue to secure contest entry")
            }
        }
    }
}

@Composable private fun ContestEntry(wallet: WalletSession, repo: LiveRepository) {
    val context = LocalContext.current

    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Secure Contest Entry", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item {
            Text(
                "Contest burns and final submission now use the same production flow as sparkdcoin.com. " +
                    "This keeps the irreversible 2,000 SPARKD burn on the already-proven website path.",
                color = androidx.compose.ui.graphics.Color.LightGray
            )
        }
        item {
            Card {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Website submission", fontSize = 20.sp, fontWeight = FontWeight.Black)
                    Text("1. Open the SPARKD contest page.")
                    Text("2. Select the exact PNG exported from Meme Forge.")
                    Text("3. Enter its title and connect Phantom.")
                    Text("4. Review and approve the 2,000 SPARKD burn once.")
                    Text("The Android app does not perform a second burn or modify the website flow.")
                }
            }
        }
        item {
            Button(
                onClick = {
                    val intent = Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("https://sparkdcoin.com/meme-of-the-week/")
                    ).apply {
                        // Do not resolve this verified sparkdcoin.com App Link back into SPARKD.
                        // The contest's proven Phantom provider flow must run in the user's browser.
                        addCategory(Intent.CATEGORY_BROWSABLE)
                        setPackage("com.android.chrome")
                    }
                    runCatching { context.startActivity(intent) }
                        .onFailure {
                            context.startActivity(
                                Intent(
                                    Intent.ACTION_VIEW,
                                    Uri.parse("https://sparkdcoin.com/meme-of-the-week/")
                                ).apply {
                                    addCategory(Intent.CATEGORY_BROWSABLE)
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                            )
                        }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Open secure website submission")
            }
        }
        item {
            Text(
                "Your Forge PNG remains on this device; choose it from the website form when prompted.",
                color = Gold
            )
        }
    }
}

