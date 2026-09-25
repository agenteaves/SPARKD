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

private fun Throwable.fullMessage(): String =
    generateSequence(this as Throwable?) { it.cause }.mapNotNull { it.message }.joinToString(" | ")

private fun Throwable.isTransientContestNetworkError(): Boolean {
    val raw = fullMessage()
    return listOf("Unable to resolve host", "No address associated with hostname", "timed out", "timeout", "connection reset", "connection refused", "temporarily unreachable", "HTTP 502", "HTTP 503", "HTTP 504").any { raw.contains(it, true) }
}

private suspend fun <T> contestPreflight(stage: String, block: suspend () -> T): T {
    var last: Throwable? = null
    repeat(3) { attempt ->
        try { return block() } catch (t: Throwable) {
            last = t
            if (!t.isTransientContestNetworkError() || attempt == 2) {
                val attempts = attempt + 1
                throw IllegalStateException(stage + " failed after " + attempts + " attempt(s): " + t.fullMessage().ifBlank { t.javaClass.simpleName }, t)
            }
            delay(700L * (attempt + 1))
        }
    }
    throw last ?: IllegalStateException(stage + " failed.")
}

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
        item { Button({
            if (walletAddress != null) go("forge") else scope.launch {
                message = "Connect your Solana wallet before creating a contest meme…"
                runCatching { wallet.connect() }
                    .onSuccess { walletAddress = it; message = "Wallet connected. Opening Meme Forge…"; go("forge") }
                    .onFailure { message = it.message ?: "Wallet connection failed." }
            }
        }, Modifier.fillMaxWidth()) { Text(if (walletAddress == null) "🔥 Connect wallet & open Meme Forge" else "🔥 Open Meme Forge") } }
        item { Button({ go("contest") }, Modifier.fillMaxWidth()) { Text("🗳 View live contenders") } }
        item { OutlinedButton({ go("submit") }, Modifier.fillMaxWidth()) { Text("📤 Submit saved Forge meme") } }
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
    var status by remember { mutableStateOf(if (record == null) "Loading your saved Forge export…" else "Original SPARKD Forge export ready for entry.") }

    LaunchedEffect(Unit) {
        if (selectedPng == null || record == null) {
            runCatching { withContext(Dispatchers.IO) { ForgeExportStore.load(context) } }
                .onSuccess { saved ->
                    if (saved != null) {
                        selectedPng = saved.first
                        record = saved.second
                        ForgeDraft.exportedPng = saved.first
                        ForgeDraft.exportedRecord = saved.second
                        status = "Original SPARKD Forge export ready for entry."
                    } else {
                        status = "Create a meme in SPARKD Meme Forge, then export it for contest entry."
                    }
                }
                .onFailure { status = "Saved Forge export could not be verified: ${it.message}" }
        }
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) scope.launch {
            status = "Verifying SPARKD Forge DNA and image pixels…"
            runCatching {
                val bytes = withContext(Dispatchers.IO) {
                    context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                        ?: error("Unable to read the selected PNG.")
                }
                val verified = withContext(Dispatchers.Default) { ForgeDna.extractAndVerify(bytes) }
                withContext(Dispatchers.IO) { ForgeExportStore.save(context, bytes) }
                bytes to verified
            }.onSuccess { (bytes, verified) ->
                selectedPng = bytes
                record = verified
                ForgeDraft.exportedPng = bytes
                ForgeDraft.exportedRecord = verified
                status = "Verified SPARKD Forge PNG selected."
            }.onFailure {
                status = (it.message ?: "This PNG did not pass SPARKD Forge verification.") +
                    if (record != null) " Your original Forge export is still ready above." else ""
            }
        }
    }

    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Submit a Meme", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item { Text("Your latest Forge export is kept inside the app and used for entry. You can also select an older exported PNG below.") }
        item { OutlinedTextField(title, { title = it.take(80) }, label = { Text("Meme title") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item { OutlinedButton({ picker.launch("image/png") }, Modifier.fillMaxWidth()) { Text("Choose an older SPARKD PNG") } }
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
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val api = remember { ContestBurnApi() }
    val recovery = remember { BurnRecoveryStore(context) }
    var confirmBurn by remember { mutableStateOf(false) }
    var submitting by remember { mutableStateOf(false) }
    var completed by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("Export a verified Forge PNG, then review the secure entry checks here.") }
    var prepared by remember { mutableStateOf<PreparedBurn?>(null) }
    val forge = ForgeDraft.exportedRecord
    val bytes = ForgeDraft.exportedPng
    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Secure Contest Entry", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item { Text("Entry requires a 2,000 SPARKD burn. The app verifies the exact server-built transaction before it can ever ask your wallet to sign.", color = androidx.compose.ui.graphics.Color.LightGray) }
        item { Card { Column(Modifier.padding(16.dp)) {
            Text("Forge export", fontWeight = FontWeight.Bold)
            Text(forge?.memeID ?: "No verified Forge export is available.")
            Text(if (bytes == null) "Export a meme from the Forge first." else "Verified PNG is retained on this device.")
        } } }
        item { Button({
            scope.launch {
                prepared = null
                status = if (wallet.address == null) "Waiting for wallet approval…" else "Checking contest entry…"
                runCatching {
                    val address = wallet.address ?: wallet.connect()
                    status = "Wallet confirmed. Checking the live contest…"
                    val record = forge ?: error("Export a verified Forge PNG first.")
                    check(record.wallet == address) { "This Forge PNG was exported for a different wallet. Re-export after connecting this wallet." }
                    val contest = contestPreflight("Live contest lookup") { repo.contest() }
                    check(contest.id.isNotBlank()) { "The live contest is unavailable." }
                    check(contest.phase == "SUBMISSION" || contest.phase == "OPEN") { "Submissions are not open for the current contest." }
                    status = "Checking for an existing submission…"
                    check(!contestPreflight("Existing submission check") { api.hasExistingSubmission(address) }) { "This wallet already has a contest submission." }
                    status = "Checking for a previously verified burn…"
                    val existingBurn = contestPreflight("Burn receipt check") { api.getBurnReceipt(address, contest.id) }
                    check(existingBurn == null) {
                        "A verified burn already exists for this contest. DO NOT BURN AGAIN. Recovery/finalization is required for transaction $existingBurn."
                    }
                    status = "Verifying SPARKD Forge DNA…"
                    contestPreflight("Forge DNA verification") { api.verifyForge(address, record) }
                    status = "Checking SPARKD balance and preparing the burn review…"
                    contestPreflight("Burn preparation") { api.prepare(address, contest.id, record.creatorID) }
                }.onSuccess {
                    prepared = it
                    status = "Entry checks passed. Review the exact burn details below."
                }.onFailure { error ->
                    status = error.message?.takeIf { message -> message.isNotBlank() }
                        ?: "Unable to prepare secure contest entry. Please try again."
                }
            }
        }, Modifier.fillMaxWidth(), enabled = forge != null && bytes != null && prepared == null) { Text(if (prepared == null) "Review secure entry" else "Entry review ready") } }
        item { Text(status, color = if (prepared != null) Green else Gold) }
        prepared?.let { burn ->
            item { Card { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Transaction review", fontSize = 20.sp, fontWeight = FontWeight.Black)
                Text("Burn amount: 2,000 SPARKD", fontWeight = FontWeight.Bold, color = Gold)
                Text("Token account: " + burn.tokenAccount.take(6) + "…" + burn.tokenAccount.takeLast(4))
                Text("One signer • one burn instruction • Token-2022 verified")
                Text("Your wallet will show the final transaction before signing. The burn is irreversible once confirmed on-chain.", color = androidx.compose.ui.graphics.Color.LightGray)
            } } }
            item {
                Button(
                    onClick = { confirmBurn = true },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !submitting && !completed
                ) { Text(if (completed) "Contest entry submitted" else "Burn 2,000 SPARKD & submit") }
            }
        }
    }

    if (confirmBurn) {
        AlertDialog(
            onDismissRequest = { if (!submitting) confirmBurn = false },
            title = { Text("Confirm contest entry") },
            text = { Text("This will ask your wallet to sign a transaction that permanently burns exactly 2,000 SPARKD. After the burn confirms, the verified PNG will be finalized as your contest entry. Do not approve unless you want to burn 2,000 SPARKD.") },
            dismissButton = {
                TextButton(onClick = { confirmBurn = false }, enabled = !submitting) { Text("Cancel") }
            },
            confirmButton = {
                Button(onClick = {
                    confirmBurn = false
                    submitting = true
                    scope.launch {
                        val burn = prepared
                        val record = forge
                        val png = bytes
                        runCatching {
                            requireNotNull(burn) { "Prepare the secure entry first." }
                            requireNotNull(record) { "Verified Forge data is missing." }
                            requireNotNull(png) { "Verified PNG is missing." }
                            val address = wallet.address ?: error("Reconnect your wallet before submitting.")
                            check(record.wallet == address) { "The connected wallet does not match this Forge export." }

                            status = "Uploading the verified contest PNG…"
                            val imagePath = api.uploadMeme(address, burn.contestId, png)

                            val pending = recovery.pending()
                            val signature = if (pending != null) {
                                check(pending.wallet == address && pending.contestId == burn.contestId) {
                                    "A saved burn belongs to a different wallet or contest. DO NOT BURN AGAIN."
                                }
                                val savedSignature = pending.transactionSignature
                                val expiry = pending.lastValidBlockHeight
                                if (savedSignature != null) {
                                    status = "Recovering the previously approved SPARKD burn…"
                                    val chain = api.transactionStatus(address, savedSignature)
                                    when {
                                        chain.found && !chain.failed -> savedSignature
                                        chain.found && chain.failed -> {
                                            recovery.clear()
                                            error("The previously signed transaction failed on-chain. It cannot burn SPARKD. Review again to build a fresh transaction.")
                                        }
                                        expiry != null && api.currentBlockHeight(address) > expiry -> {
                                            recovery.clear()
                                            prepared = null
                                            error("The previously signed transaction expired without landing. No burn was sent. Tap Review secure entry; SPARKD will build a fresh transaction.")
                                        }
                                        else -> {
                                            val resent = api.resendSignedTransaction(address, burn.contestId, pending.signedTransaction)
                                            check(resent == savedSignature) { "Recovered transaction signature changed. DO NOT BURN AGAIN." }
                                            resent
                                        }
                                    }
                                } else {
                                    // Legacy 1.0.20 marker: it was already rejected as expired before broadcast.
                                    // Clear both recovery and the stale review so the next review always gets a fresh blockhash.
                                    recovery.clear()
                                    prepared = null
                                    error("The saved transaction expired before broadcast. No burn was sent. Tap Review secure entry; SPARKD will build a fresh transaction.")
                                }
                            } else {
                                status = "Waiting for Phantom approval to sign exactly the reviewed 2,000 SPARKD burn…"
                                val signedTransaction = wallet.signTransaction(burn.unsignedTransaction)
                                recovery.save(burn.contestId, address, signedTransaction, lastValidBlockHeight = burn.lastValidBlockHeight)
                                status = "Phantom approved. Sending the exact signed transaction through SPARKD…"
                                val sent = api.sendSignedTransaction(
                                    address,
                                    burn.contestId,
                                    signedTransaction,
                                    burn.unsignedTransaction,
                                    recovery
                                )
                                recovery.save(burn.contestId, address, signedTransaction, sent, burn.lastValidBlockHeight)
                                sent
                            }

                            status = "SPARKD submitted the signed transaction. Verifying the exact 2,000 SPARKD burn on-chain…"
                            api.verifyBurn(address, signature)

                            status = "Recording the verified burn receipt…"
                            api.recordBurnReceipt(address, burn.contestId, signature)

                            status = "Finalizing your contest submission…"
                            api.finalizeSubmission(address, burn, signature, record, ForgeDraft.submissionTitle, imagePath)

                            recovery.clear()
                            signature
                        }.onSuccess { signature ->
                            completed = true
                            runCatching { ForgeExportStore.clear(context) }
                            ForgeDraft.exportedPng = null
                            ForgeDraft.exportedRecord = null
                            status = "Contest entry submitted successfully. Burn verified: " + signature.take(8) + "…" + signature.takeLast(8)
                        }.onFailure { error ->
                            val pending = recovery.pending()
                            status = if (pending != null) {
                                "Submission did not finish, but the signed burn is saved for recovery. DO NOT BURN AGAIN. Tap submit again to resume safely. " +
                                    (error.message ?: "")
                            } else {
                                error.message ?: "Contest submission failed before a signed burn was saved."
                            }
                        }
                        submitting = false
                    }
                }, enabled = !submitting) { Text("Confirm 2,000 SPARKD burn") }
            }
        )
    }
}
