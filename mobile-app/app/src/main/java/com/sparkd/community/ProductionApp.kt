package com.sparkd.community

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.graphics.BitmapFactory
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material.icons.filled.WorkspacePremium
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
                throw IllegalStateException(stage + " failed after " + (attempt + 1) + " attempt(s): " + t.fullMessage().ifBlank { t.javaClass.simpleName }, t)
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
        val installedVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) packageInfo.longVersionCode else {
            @Suppress("DEPRECATION") packageInfo.versionCode.toLong()
        }
        runCatching { AppUpdateRepository().latest() }.onSuccess { latest ->
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
            confirmButton = { Button(onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(update.downloadUrl))) }) { Text("Update now") } },
            dismissButton = { TextButton(onClick = { availableUpdate = null }) { Text("Later") } }
        )
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                navigationIcon = { if (page != "home") IconButton(onClick = goHome) { Icon(Icons.Default.ArrowBack, "Back to home") } },
                title = { Text("SPARKD", fontWeight = FontWeight.Black) }
            )
        },
        bottomBar = {
            NavigationBar {
                Tab.entries.forEach { tab ->
                    val route = when (tab) { Tab.Home -> "home"; Tab.Forge -> "forge"; Tab.Contest -> "contest"; Tab.Winners -> "winners"; Tab.Profile -> "profile" }
                    val icon = when (tab) { Tab.Home -> Icons.Default.Home; Tab.Forge -> Icons.Default.Edit; Tab.Contest -> Icons.Default.EmojiEvents; Tab.Winners -> Icons.Default.WorkspacePremium; Tab.Profile -> Icons.Default.Person }
                    NavigationBarItem(selected = page == route, onClick = { page = route }, icon = { Icon(icon, tab.label) }, label = { Text(tab.label) })
                }
                NavigationBarItem(selected = page == "submit", onClick = { page = "submit" }, icon = { Icon(Icons.Default.UploadFile, "Submit") }, label = { Text("Submit") })
            }
        }
    ) { padding ->
        when (page) {
            "forge" -> Box(Modifier.padding(padding)) { Forge(wallet) { page = "submit" } }
            "contest" -> Box(Modifier.padding(padding)) { Contest(repo) }
            "submit" -> Box(Modifier.padding(padding)) { SubmitOrRecover(onOpenForge = { page = "forge" }, onReady = { page = "entry" }) }
            "winners" -> Box(Modifier.padding(padding)) { Winners(repo) }
            "profile" -> Box(Modifier.padding(padding)) { Profile(wallet) }
            "entry" -> Box(Modifier.padding(padding)) { ContestEntry(wallet, repo) }
            else -> LiveHome(Modifier.padding(padding), repo, wallet) { page = it }
        }
    }
}

@Composable private fun SubmitOrRecover(onOpenForge: () -> Unit, onReady: () -> Unit) {
    val context = LocalContext.current
    val pending = remember { BurnRecoveryStore(context).pending() }
    var message by remember { mutableStateOf("") }
    var title by remember { mutableStateOf(ForgeDraft.submissionTitle.ifBlank { ForgeDraft.title }) }
    val ready = ForgeDraft.freshSourceSelected && ForgeDraft.entryImageSelected &&
        ForgeDraft.exportedPng != null && ForgeDraft.exportedRecord != null
    val preview = remember(ForgeDraft.exportedPng) {
        ForgeDraft.exportedPng?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
    }
    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Submit a Meme", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item { Text("Choose an image in Meme Forge, create your meme, then send it here for submission.") }
        item { Button(onClick = onOpenForge, modifier = Modifier.fillMaxWidth()) { Text("Open Meme Forge") } }
        item { Text(if (ready) "Verified Forge meme ready: ${ForgeDraft.exportedRecord?.memeID}" else "No new Forge meme ready for entry.", color = if (ready) Green else Gold) }
        if (ready && preview != null) item {
            Image(preview.asImageBitmap(), "Meme selected for contest entry", Modifier.fillMaxWidth().aspectRatio(1f))
        }
        item { OutlinedTextField(title, { title = it.take(80) }, label = { Text("Meme title (required)") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item { Button(onClick = { ForgeDraft.submissionTitle = title.trim(); onReady() }, modifier = Modifier.fillMaxWidth(), enabled = ready && title.isNotBlank()) { Text("Continue to secure contest entry") } }
        if (pending?.transactionSignature != null) {
            item { Text("Already approved a burn? Resume that entry without burning again.") }
            item { OutlinedButton(onClick = {
                runCatching {
                    val saved = ForgeExportStore.load(context) ?: error("The original Forge export is unavailable. Contact SPARKD support with your burn transaction.")
                    check(saved.second.wallet == pending.wallet) { "The saved meme belongs to a different wallet." }
                    ForgeDraft.exportedPng = saved.first
                    ForgeDraft.exportedRecord = saved.second
                    ForgeDraft.entryImageSelected = true
                    ForgeDraft.freshSourceSelected = true // Recovery only: this image was already made in the Forge for the approved burn.
                    ForgeDraft.submissionTitle = title.trim()
                    onReady()
                }.onFailure { message = it.message ?: "Could not recover the prior Forge export." }
            }, modifier = Modifier.fillMaxWidth(), enabled = title.isNotBlank()) { Text("Resume approved burn") } }
        }
        if (message.isNotBlank()) item { Text(message, color = Gold) }
    }
}

@Composable private fun LiveHome(modifier: Modifier, repo: LiveRepository, wallet: WalletSession, go: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var contest by remember { mutableStateOf<Contest?>(null) }
    var walletAddress by remember { mutableStateOf(wallet.address) }
    var message by remember { mutableStateOf("Loading the live SPARKD contest…") }
    LaunchedEffect(Unit) {
        while (isActive) {
            runCatching { repo.contest() }.onSuccess { contest = it; message = "" }.onFailure { if (contest == null) message = "Live contest data is temporarily unavailable. Retrying automatically…" }
            delay(15_000)
        }
    }
    LazyColumn(modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Create. Enter. Equal chance. Win.", fontSize = 30.sp, fontWeight = FontWeight.Black) }
        item { Text("Every eligible meme receives exactly one chance in SPARKD's automated random drawing.") }
        item { Text(if (walletAddress == null) "Connect your Solana wallet to participate." else "Wallet connected: " + walletAddress!!.take(6) + "…" + walletAddress!!.takeLast(4)) }
        item { Card { Column(Modifier.padding(18.dp)) { Text(contest?.phase ?: "LIVE", fontWeight = FontWeight.Bold); Text(contest?.title ?: message, fontSize = 23.sp, fontWeight = FontWeight.Black); contest?.let { Text(it.prize) } } } }
        item { Button({ if (walletAddress != null) go("forge") else scope.launch { message = "Opening your Solana wallet…"; runCatching { wallet.connect() }.onSuccess { walletAddress = it; go("forge") }.onFailure { message = it.message ?: "Wallet connection failed." } } }, Modifier.fillMaxWidth()) { Text(if (walletAddress == null) "🔥 Connect wallet & open Meme Forge" else "🔥 Open Meme Forge") } }
        item { Button({ go("contest") }, Modifier.fillMaxWidth()) { Text("🎲 View eligible contenders") } }
        item { OutlinedButton({ if (walletAddress != null) { wallet.disconnect(); walletAddress = null; message = "Wallet disconnected." } else scope.launch { runCatching { wallet.connect() }.onSuccess { walletAddress = it; message = "Wallet connected." }.onFailure { message = it.message ?: "Wallet connection failed." } } }, Modifier.fillMaxWidth()) { Text(if (walletAddress == null) "Connect Solana Wallet" else "Disconnect Wallet") } }
        if (message.isNotBlank()) item { Text(message) }
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
    var existingBurnSignature by remember { mutableStateOf<String?>(null) }
    var entryTitle by remember { mutableStateOf(ForgeDraft.submissionTitle) }
    val forge = ForgeDraft.exportedRecord
    val bytes = ForgeDraft.exportedPng

    suspend fun verifiedSelectedPng(record: ForgeDnaRecord, png: ByteArray) {
        check(ForgeDraft.freshSourceSelected && ForgeDraft.entryImageSelected && ForgeDraft.exportedPng === png) { "Choose an image in Meme Forge and export it before entering the contest." }
        val verified = withContext(Dispatchers.Default) { ForgeDna.extractAndVerify(png) }
        check(verified == record) { "The selected PNG no longer matches its Forge data. Select it again." }
    }

    fun requiredTitle(): String {
        val clean = entryTitle.trim()
        check(clean.isNotEmpty()) { "Give your meme a title before entering the contest." }
        ForgeDraft.submissionTitle = clean
        return clean
    }

    suspend fun finalizeWithExistingBurn(burn: PreparedBurn, signature: String, record: ForgeDnaRecord, png: ByteArray): String {
        val title = requiredTitle()
        verifiedSelectedPng(record, png)
        val address = wallet.address ?: error("Reconnect your wallet before submitting.")
        status = "Verifying the existing 2,000 SPARKD burn…"
        api.verifyBurn(address, signature)
        status = "Uploading your selected verified Forge PNG…"
        val imagePath = api.uploadMeme(address, burn.contestId, png)
        status = "Finalizing your selected meme with the existing burn receipt…"
        api.finalizeSubmission(address, burn, signature, record, title, imagePath)
        recovery.clear()
        return signature
    }

    suspend fun finalizeWithNewBurn(burn: PreparedBurn, record: ForgeDnaRecord, png: ByteArray): String {
        val title = requiredTitle()
        verifiedSelectedPng(record, png)
        val address = wallet.address ?: error("Reconnect your wallet before submitting.")
        status = "Uploading the verified contest PNG…"
        val imagePath = api.uploadMeme(address, burn.contestId, png)
        val pending = recovery.pending()
        val signature = if (pending != null) {
            check(pending.wallet == address && pending.contestId == burn.contestId) { "A saved burn belongs to a different wallet or contest. DO NOT BURN AGAIN." }
            val savedSignature = pending.transactionSignature
            val expiry = pending.lastValidBlockHeight
            if (savedSignature != null) {
                status = "Recovering the previously approved SPARKD burn…"
                val chain = api.transactionStatus(address, savedSignature)
                when {
                    chain.found && !chain.failed -> savedSignature
                    chain.found && chain.failed -> { recovery.clear(); error("The previously signed transaction failed on-chain. Review again to build a fresh transaction.") }
                    expiry != null && api.currentBlockHeight(address) > expiry -> { recovery.clear(); prepared = null; error("The previously signed transaction expired without landing. Tap Review secure entry to build a fresh transaction.") }
                    else -> {
                        val resent = api.resendSignedTransaction(address, burn.contestId, pending.signedTransaction)
                        check(resent == savedSignature) { "Recovered transaction signature changed. DO NOT BURN AGAIN." }
                        resent
                    }
                }
            } else { recovery.clear(); prepared = null; error("The saved transaction expired before broadcast. Tap Review secure entry to build a fresh transaction.") }
        } else {
            status = "Waiting for wallet approval to sign exactly the reviewed 2,000 SPARKD burn…"
            val signedTransaction = wallet.signTransaction(burn.unsignedTransaction)
            recovery.save(burn.contestId, address, signedTransaction, lastValidBlockHeight = burn.lastValidBlockHeight)
            val sent = api.sendSignedTransaction(address, burn.contestId, signedTransaction, burn.unsignedTransaction, recovery)
            recovery.save(burn.contestId, address, signedTransaction, sent, burn.lastValidBlockHeight)
            sent
        }
        status = "Verifying the exact 2,000 SPARKD burn on-chain…"
        api.verifyBurn(address, signature)
        status = "Recording the verified burn receipt…"
        api.recordBurnReceipt(address, burn.contestId, signature)
        status = "Finalizing your contest submission…"
        api.finalizeSubmission(address, burn, signature, record, title, imagePath)
        recovery.clear()
        return signature
    }

    fun finishSuccess(signature: String) {
        completed = true
        runCatching { ForgeExportStore.clear(context) }
        ForgeDraft.exportedPng = null
        ForgeDraft.exportedRecord = null
        ForgeDraft.entryImageSelected = false
        ForgeDraft.freshSourceSelected = false
        status = "Contest entry submitted successfully. Your meme now has one equal chance in the random draw. Burn verified: " + signature.take(8) + "…" + signature.takeLast(8)
    }

    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Secure Contest Entry", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item { OutlinedTextField(entryTitle, { entryTitle = it.take(80) }, label = { Text("Meme title (required)") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item { Text("Entry requires one 2,000 SPARKD burn per wallet and contest. Every finalized eligible meme gets exactly one equal chance in the automated draw.", color = androidx.compose.ui.graphics.Color.LightGray) }
        item { Card { Column(Modifier.padding(16.dp)) { Text("Forge export", fontWeight = FontWeight.Bold); Text(forge?.memeID ?: "No verified Forge export is available."); Text(if (bytes == null) "Export a meme from the Forge first." else "Verified PNG is retained on this device.") } } }
        item {
            Button({
                scope.launch {
                    prepared = null; existingBurnSignature = null
                    status = if (wallet.address == null) "Waiting for wallet approval…" else "Checking contest entry…"
                    runCatching {
                        requiredTitle()
                        val record = forge ?: error("Export a verified Forge PNG first.")
                        val png = bytes ?: error("Select a verified Forge PNG first.")
                        verifiedSelectedPng(record, png)
                        val address = wallet.address ?: wallet.connect()
                        check(record.wallet == address || record.wallet == "NOT_CONNECTED") { "This Forge PNG was exported for a different wallet. Re-export after connecting this wallet." }
                        val contest = contestPreflight("Live contest lookup") { repo.contest() }
                        check(contest.id.isNotBlank()) { "The live contest is unavailable." }
                        check(contest.phase == "SUBMISSION" || contest.phase == "OPEN") { "Submissions are not open for the current contest." }
                        check(!contestPreflight("Existing submission check") { api.hasExistingSubmission(address) }) { "This wallet already has a finalized contest submission." }
                        status = "Verifying SPARKD Forge DNA…"
                        contestPreflight("Forge DNA verification") { api.verifyForge(address, record) }
                        status = "Checking for a previously verified burn…"
                        val existingBurn = contestPreflight("Burn receipt check") { api.getBurnReceipt(address, contest.id) }
                        if (existingBurn != null) {
                            existingBurnSignature = existingBurn
                            PreparedBurn(contest.id, "existing-burn", ByteArray(0), 0L)
                        } else {
                            status = "Checking SPARKD balance and preparing the burn review…"
                            contestPreflight("Burn preparation") { api.prepare(address, contest.id, record.creatorID) }
                        }
                    }.onSuccess { burn ->
                        prepared = burn
                        status = if (existingBurnSignature != null) "Existing verified contest burn found. No second burn is required." else "Entry checks passed. Review the exact burn details below."
                    }.onFailure { error -> status = error.message?.takeIf { it.isNotBlank() } ?: "Unable to prepare secure contest entry. Please try again." }
                }
            }, Modifier.fillMaxWidth(), enabled = entryTitle.isNotBlank() && ForgeDraft.freshSourceSelected && ForgeDraft.entryImageSelected && forge != null && bytes != null && prepared == null && !completed) { Text(if (prepared == null) "Review secure entry" else "Entry review ready") }
        }
        item { Text(status, color = if (prepared != null) Green else Gold) }
        prepared?.let { burn ->
            if (existingBurnSignature != null) {
                item { Card { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("Existing burn verified", fontSize = 20.sp, fontWeight = FontWeight.Black); Text("No additional SPARKD burn is required.", fontWeight = FontWeight.Bold, color = Green); Text("This verified meme will receive one equal chance in the random drawing.") } } }
                item { Button(onClick = {
                    submitting = true; scope.launch {
                        val record = forge; val png = bytes; val signature = existingBurnSignature
                        runCatching { finalizeWithExistingBurn(burn, requireNotNull(signature), requireNotNull(record), requireNotNull(png)) }.onSuccess { finishSuccess(it) }.onFailure { status = it.message ?: "Submission finalization failed. Your existing burn remains valid; do not burn again." }
                        submitting = false
                    }
                }, modifier = Modifier.fillMaxWidth(), enabled = entryTitle.isNotBlank() && !submitting && !completed) { Text(if (completed) "Contest entry submitted" else "Submit verified meme — no new burn") } }
            } else {
                item { Card { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("Transaction review", fontSize = 20.sp, fontWeight = FontWeight.Black); Text("Burn amount: 2,000 SPARKD", fontWeight = FontWeight.Bold, color = Gold); Text("Selection: one equal random chance"); Text("Token account: " + burn.tokenAccount.take(6) + "…" + burn.tokenAccount.takeLast(4)); Text("One signer • one burn instruction • Token-2022 verified"); Text("Your wallet will show the final transaction before signing. The burn is irreversible once confirmed on-chain.", color = androidx.compose.ui.graphics.Color.LightGray) } } }
                item { Button(onClick = { confirmBurn = true }, modifier = Modifier.fillMaxWidth(), enabled = entryTitle.isNotBlank() && !submitting && !completed) { Text(if (completed) "Contest entry submitted" else "Burn 2,000 SPARKD & submit") } }
            }
        }
    }

    if (confirmBurn) {
        AlertDialog(
            onDismissRequest = { if (!submitting) confirmBurn = false },
            title = { Text("Confirm contest entry") },
            text = { Text("This will ask your wallet to sign a transaction that permanently burns exactly 2,000 SPARKD. Every eligible meme receives one equal chance in the draw. Do not approve unless you want to burn 2,000 SPARKD.") },
            dismissButton = { TextButton(onClick = { confirmBurn = false }, enabled = !submitting) { Text("Cancel") } },
            confirmButton = { Button(onClick = {
                confirmBurn = false; submitting = true
                scope.launch {
                    val burn = prepared; val record = forge; val png = bytes
                    runCatching { finalizeWithNewBurn(requireNotNull(burn), requireNotNull(record), requireNotNull(png)) }.onSuccess { finishSuccess(it) }.onFailure { error -> status = if (recovery.pending() != null) "Submission did not finish, but the signed burn is saved for recovery. DO NOT BURN AGAIN. Tap submit again to resume safely. " + (error.message ?: "") else error.message ?: "Contest submission failed before a signed burn was saved." }
                    submitting = false
                }
            }, enabled = entryTitle.isNotBlank() && !submitting) { Text("Confirm 2,000 SPARKD burn") } }
        )
    }
}
