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
import java.util.UUID

private fun formatSparkdEntryAmount(value: Double): String =
    String.format(java.util.Locale.US, "%,.6f", value).trimEnd('0').trimEnd('.')

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
    val updateScope = rememberCoroutineScope()
    var updateJob by remember { mutableStateOf<kotlinx.coroutines.Job?>(null) }
    var updateDownloading by remember { mutableStateOf(false) }
    var updateProgress by remember { mutableStateOf<Float?>(null) }
    var updateMessage by remember { mutableStateOf("") }
    var downloadedUpdate by remember { mutableStateOf<java.io.File?>(null) }
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
            onDismissRequest = { if (!updateDownloading) availableUpdate = null },
            title = { Text("SPARKD update available") },
            text = { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Version ${update.versionName} is ready. Download it here, then approve installation in Android.")
                if (updateDownloading) {
                    val value = updateProgress
                    if (value == null) LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    else LinearProgressIndicator(progress = { value }, modifier = Modifier.fillMaxWidth())
                }
                if (updateMessage.isNotBlank()) Text(updateMessage)
            } },
            confirmButton = { Button(enabled = !updateDownloading, onClick = {
                val file = downloadedUpdate
                if (file != null) {
                    runCatching { installAppUpdate(context, file, update) }.onSuccess { opened ->
                        updateMessage = if (opened) "Complete the update in Android's installation screen." else "Allow SPARKD to install its update, return here, then tap Install update."
                    }.onFailure { updateMessage = it.message ?: "Unable to open Android's installer." }
                } else {
                    updateDownloading = true; updateProgress = null; updateMessage = "Connecting to the update download…"
                    updateJob = updateScope.launch {
                        try {
                            downloadedUpdate = downloadAppUpdate(context, update) { value, message -> updateProgress = value; updateMessage = message }
                            updateMessage = "Download verified. Tap Install update."
                        } catch (error: kotlinx.coroutines.CancellationException) { throw error }
                        catch (error: Exception) { updateMessage = "Download failed: " + (error.message ?: "Check your connection.") + " Tap Retry download." }
                        finally { updateDownloading = false }
                    }
                }
            }) { Text(if (downloadedUpdate != null) "Install update" else if (updateMessage.startsWith("Download failed")) "Retry download" else "Download update") } },
            dismissButton = { TextButton(onClick = { updateJob?.cancel(); availableUpdate = null }) { Text(if (updateDownloading) "Cancel download" else "Later") } }
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
        item {
            Card {
                Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Entry burn: $3 worth of SPARKD", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Gold)
                    Text("$3 worth of SPARKD will be burned per meme entry. The exact token amount is calculated from the live price quote and shown before you approve.")
                    Text("SOL network fees are separate.", color = androidx.compose.ui.graphics.Color.LightGray)
                }
            }
        }
        item { Text("Choose an image in Meme Forge, create your meme, then send it here for submission.") }
        item { Button(onClick = onOpenForge, modifier = Modifier.fillMaxWidth()) { Text("Open Meme Forge") } }
        item { Text(if (ready) "Meme ready for entry" else "No new meme ready for entry.", color = if (ready) Green else Gold) }
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
    var status by remember { mutableStateOf("Send a meme to the Submit tab, then review the secure entry checks here.") }
    var prepared by remember { mutableStateOf<PreparedBurn?>(null) }
    var existingBurnSignature by remember { mutableStateOf<String?>(null) }
    var entryTitle by remember { mutableStateOf(ForgeDraft.submissionTitle) }
    var xHandle by remember { mutableStateOf("") }
    var winnerContactSaved by remember { mutableStateOf<Boolean?>(null) }
    var entrySubmissionId by remember { mutableStateOf(UUID.randomUUID().toString()) }
    val forge = ForgeDraft.exportedRecord
    val bytes = ForgeDraft.exportedPng

    suspend fun verifiedSelectedPng(record: MemeEntryRecord, png: ByteArray) {
        check(ForgeDraft.freshSourceSelected && ForgeDraft.entryImageSelected && ForgeDraft.exportedPng === png) { "Choose an image in Meme Forge and export it before entering the contest." }
        check(record.memeID.isNotBlank() && record.creatorID.isNotBlank()) { "The selected meme is missing its recovery ID." }
        check(png.isNotEmpty() && png.size <= 10 * 1024 * 1024) { "The selected PNG must be 10 MB or smaller." }
        check(withContext(Dispatchers.Default) { BitmapFactory.decodeByteArray(png, 0, png.size) != null }) { "The selected PNG could not be displayed." }
    }

    fun normalizedXHandle(): String? {
        val clean = xHandle.trim().removePrefix("@")
        require(clean.isEmpty() || clean.matches(Regex("^[A-Za-z0-9_]{1,15}$"))) {
            "Enter a valid X username (letters, numbers, or underscore; up to 15 characters)."
        }
        return clean.takeIf { it.isNotEmpty() }
    }

    fun requiredTitle(): String {
        val clean = entryTitle.trim()
        check(clean.isNotEmpty()) { "Give your meme a title before entering the contest." }
        normalizedXHandle()
        ForgeDraft.submissionTitle = clean
        return clean
    }

    suspend fun saveOptionalWinnerContact(submissionId: String, address: String): Boolean? {
        val handle = normalizedXHandle() ?: return null
        status = "Your meme is submitted. Confirm your optional X contact with a free wallet message signature…"
        val timestamp = System.currentTimeMillis()
        val message = listOf(
            "SPARKD-CONTEST-CONTACT-v1",
            submissionId,
            address,
            handle,
            timestamp.toString()
        ).joinToString("\n")
        return runCatching {
            val signedMessage = wallet.signMessage(message.toByteArray(Charsets.UTF_8))
            api.saveWinnerContact(submissionId, address, handle, timestamp, signedMessage)
            true
        }.getOrElse {
            status = "Your meme is submitted, but the X contact was not saved. Contact @deedsparks on X with your wallet address if you win."
            false
        }
    }

    suspend fun finalizeWithExistingBurn(burn: PreparedBurn, signature: String, record: MemeEntryRecord, png: ByteArray): String {
        val title = requiredTitle()
        verifiedSelectedPng(record, png)
        val address = wallet.address ?: error("Reconnect your wallet before submitting.")
        status = "Using the existing server-verified SPARKD burn…"
        status = "Uploading your selected meme…"
        val imagePath = api.uploadMeme(address, burn.contestId, png)
        status = "Finalizing your selected meme with the existing burn receipt…"
        api.finalizeSubmission(address, burn, signature, entrySubmissionId, record, title, imagePath)
        recovery.clear()
        winnerContactSaved = saveOptionalWinnerContact(entrySubmissionId, address)
        return signature
    }

    suspend fun finalizeWithNewBurn(burn: PreparedBurn, record: MemeEntryRecord, png: ByteArray): String {
        val title = requiredTitle()
        verifiedSelectedPng(record, png)
        val address = wallet.address ?: error("Reconnect your wallet before submitting.")
        status = "Uploading the contest meme…"
        val imagePath = api.uploadMeme(address, burn.contestId, png)
        val pending = recovery.pending()
        val transactionQuoteToken = if (pending != null) pending.quoteToken?.takeIf { it.isNotBlank() } ?: error("The saved burn has no matching server quote. Check for a verified receipt before starting another entry.") else burn.quoteToken
        check(transactionQuoteToken.isNotBlank()) { "The signed $3 SPARKD quote is missing." }
        val signature = if (pending != null) {
            check(pending.wallet == address && pending.contestId == burn.contestId) { "A saved burn belongs to a different wallet or contest. DO NOT BURN AGAIN." }
            val savedSignature = pending.transactionSignature
            val expiry = pending.lastValidBlockHeight
            status = "Recovering the previously approved SPARKD burn…"
            if (savedSignature != null) {
                val chain = api.transactionStatus(address, savedSignature)
                when {
                    chain.found && !chain.failed -> savedSignature
                    chain.found && chain.failed -> { recovery.clear(); error("The previously signed transaction failed on-chain. Review the entry again before starting another burn.") }
                    expiry == null || api.currentBlockHeight(address) > expiry -> error("The saved transaction expired without a verified receipt. Check the contest page or contact SPARKD support before starting another burn.")
                    else -> {
                        val resent = api.resendSignedTransaction(address, burn.contestId, pending.signedTransaction, transactionQuoteToken)
                        check(resent == savedSignature) { "Recovered transaction signature changed. DO NOT BURN AGAIN." }
                        resent
                    }
                }
            } else {
                if (expiry == null || api.currentBlockHeight(address) > expiry) error("The saved transaction expired without a verified receipt. Check the contest page or contact SPARKD support before starting another burn.")
                val resent = api.resendSignedTransaction(address, burn.contestId, pending.signedTransaction, transactionQuoteToken)
                recovery.save(burn.contestId, address, pending.signedTransaction, resent, expiry, transactionQuoteToken)
                resent
            }
        } else {
            check(burn.quoteExpiresAtMillis > System.currentTimeMillis()) { prepared = null; error("The $3 SPARKD quote expired. Review the entry again for a fresh amount.") }
            status = "Waiting for wallet approval to sign the $3 SPARKD burn (${formatSparkdEntryAmount(burn.burnAmount)} SPARKD)…"
            val signedTransaction = wallet.signTransaction(burn.unsignedTransaction)
            recovery.save(burn.contestId, address, signedTransaction, lastValidBlockHeight = burn.lastValidBlockHeight, quoteToken = transactionQuoteToken)
            val sent = api.sendSignedTransaction(address, burn.contestId, signedTransaction, burn.unsignedTransaction, recovery, transactionQuoteToken, burn.lastValidBlockHeight)
            recovery.save(burn.contestId, address, signedTransaction, sent, burn.lastValidBlockHeight, transactionQuoteToken)
            sent
        }
        status = "Verifying the quoted $3 SPARKD burn on-chain…"
        api.verifyBurn(address, signature, burn.contestId, transactionQuoteToken)
        status = "Recording the verified burn receipt…"
        api.recordBurnReceipt(address, burn.contestId, signature, transactionQuoteToken)
        status = "Finalizing your contest submission…"
        api.finalizeSubmission(address, burn, signature, entrySubmissionId, record, title, imagePath)
        recovery.clear()
        winnerContactSaved = saveOptionalWinnerContact(entrySubmissionId, address)
        return signature
    }

    fun finishSuccess(signature: String) {
        completed = true
        runCatching { ForgeExportStore.clear(context) }
        ForgeDraft.exportedPng = null
        ForgeDraft.exportedRecord = null
        ForgeDraft.entryImageSelected = false
        ForgeDraft.freshSourceSelected = false
        val contactNote = when (winnerContactSaved) {
            true -> " Your X handle is saved privately for winner contact."
            false -> " Your X handle could not be saved; contact @deedsparks on X with your wallet address if you win."
            null -> ""
        }
        if (winnerContactSaved != false) {
            status = "Contest entry submitted successfully. Your meme now has one equal chance in the random draw. Burn verified: " + signature.take(8) + "…" + signature.takeLast(8) + contactNote
        }
        entrySubmissionId = UUID.randomUUID().toString()
        winnerContactSaved = null
    }

    LazyColumn(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Secure Contest Entry", fontSize = 28.sp, fontWeight = FontWeight.Black) }
        item { OutlinedTextField(entryTitle, { entryTitle = it.take(80) }, label = { Text("Meme title (required)") }, modifier = Modifier.fillMaxWidth(), singleLine = true) }
        item { OutlinedTextField(xHandle, { xHandle = it.take(16) }, label = { Text("X username (optional)") }, supportingText = { Text("Used only to contact you if you win. Kept private; does not affect the draw. A free wallet signature confirms it.") }, modifier = Modifier.fillMaxWidth(), singleLine = true, enabled = !completed) }
        item { Text("Each entry burns $3 worth of SPARKD at the server-quoted rate. Every finalized eligible meme gets exactly one equal chance in the automated draw.", color = androidx.compose.ui.graphics.Color.LightGray) }
        item { Card { Column(Modifier.padding(16.dp)) { Text("Forge export", fontWeight = FontWeight.Bold); Text(forge?.memeID ?: "No meme is ready for submission."); Text(if (bytes == null) "Export a meme from the Forge first." else "Your meme is retained on this device.") } } }
        item {
            Button({
                scope.launch {
                    prepared = null; existingBurnSignature = null
                    status = if (wallet.address == null) "Waiting for wallet approval…" else "Checking contest entry…"
                    runCatching {
                        requiredTitle()
                        val record = forge ?: error("Send a meme from the Forge first.")
                        val png = bytes ?: error("Select a meme first.")
                        verifiedSelectedPng(record, png)
                        val address = wallet.address ?: wallet.connect()
                        check(record.wallet == address || record.wallet == "NOT_CONNECTED") { "This Forge PNG was exported for a different wallet. Re-export after connecting this wallet." }
                        val contest = contestPreflight("Live contest lookup") { repo.contest() }
                        check(contest.id.isNotBlank()) { "The live contest is unavailable." }
                        check(contest.phase == "SUBMISSION" || contest.phase == "OPEN") { "Submissions are not open for the current contest." }
                        check(!contestPreflight("Existing submission check") { api.hasExistingSubmission(address) }) { "This wallet already has a finalized contest submission." }
                        api.selectMeme(record)
                        val savedBurn = recovery.pending()
                        if (savedBurn != null) {
                            check(savedBurn.wallet == address && savedBurn.contestId == contest.id) { "A previous signed burn belongs to another wallet or contest. DO NOT BURN AGAIN. Contact SPARKD support." }
                            check(!savedBurn.quoteToken.isNullOrBlank()) { "The saved signed burn has no quote token. DO NOT BURN AGAIN. Contact SPARKD support." }
                            status = "Checking the previous signed burn. No new burn will be prepared…"
                        } else {
                            status = "Checking contest eligibility…"
                        }
                        status = "Checking for a previously verified burn…"
                        val existingBurn = contestPreflight("Burn receipt check") { api.getBurnReceipt(address, contest.id) }
                        if (existingBurn != null) {
                            existingBurnSignature = existingBurn
                            PreparedBurn(contest.id, "existing-burn", ByteArray(0), 0L)
                        } else if (savedBurn != null) {
                            PreparedBurn(contest.id, "saved-burn", ByteArray(0), savedBurn.lastValidBlockHeight ?: 0L, savedBurn.quoteToken.orEmpty())
                        } else {
                            status = "Checking SPARKD balance and preparing the burn review…"
                            contestPreflight("Burn preparation") { api.prepare(address, contest.id, record.creatorID) }
                        }
                    }.onSuccess { burn ->
                        prepared = burn
                        status = when {
                            existingBurnSignature != null -> "Existing verified contest burn found. No second burn is required."
                            burn.tokenAccount == "saved-burn" -> "Previous signed burn found. Recovery only: no new transaction will be signed. DO NOT BURN AGAIN."
                            else -> "Entry checks passed. Review the exact burn details below."
                        }
                    }.onFailure { error -> status = error.message?.takeIf { it.isNotBlank() } ?: "Unable to prepare secure contest entry. Please try again." }
                }
            }, Modifier.fillMaxWidth(), enabled = entryTitle.isNotBlank() && ForgeDraft.freshSourceSelected && ForgeDraft.entryImageSelected && forge != null && bytes != null && prepared == null && !completed) { Text(if (prepared == null) "Review secure entry" else "Entry review ready") }
        }
        item { Text(status, color = if (prepared != null) Green else Gold) }
        prepared?.let { burn ->
            if (existingBurnSignature != null) {
                item { Card { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("Existing burn verified", fontSize = 20.sp, fontWeight = FontWeight.Black); Text("No additional SPARKD burn is required.", fontWeight = FontWeight.Bold, color = Green); Text("This meme will receive one equal chance in the random drawing.") } } }
                item { Button(onClick = {
                    submitting = true; scope.launch {
                        val record = forge; val png = bytes; val signature = existingBurnSignature
                        runCatching { finalizeWithExistingBurn(burn, requireNotNull(signature), requireNotNull(record), requireNotNull(png)) }.onSuccess { finishSuccess(it) }.onFailure { status = it.message ?: "Submission finalization failed. Your existing burn remains valid; do not burn again." }
                        submitting = false
                    }
                }, modifier = Modifier.fillMaxWidth(), enabled = entryTitle.isNotBlank() && !submitting && !completed) { Text(if (completed) "Contest entry submitted" else "Submit meme — no new burn") } }
            } else if (burn.tokenAccount == "saved-burn") {
                item { Text("A signed transaction is saved. Recovery will check its on-chain status and will not request a new wallet signature.", color = Gold) }
                item { Button(onClick = {
                    submitting = true
                    scope.launch {
                        runCatching { finalizeWithNewBurn(burn, requireNotNull(forge), requireNotNull(bytes)) }
                            .onSuccess { finishSuccess(it) }
                            .onFailure { error -> status = "Recovery not completed. DO NOT BURN AGAIN. " + (error.message ?: "Contact SPARKD support with your wallet address and transaction signature.") }
                        submitting = false
                    }
                }, modifier = Modifier.fillMaxWidth(), enabled = !submitting && !completed) { Text(if (submitting) "Checking saved burn…" else "Recover previous burn — no new signature") } }
            } else {
                val burnAmountLabel = formatSparkdEntryAmount(burn.burnAmount)
                item { Card { Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("Transaction review", fontSize = 20.sp, fontWeight = FontWeight.Black); Text("Burn amount: $burnAmountLabel SPARKD (target $3.00)", fontWeight = FontWeight.Bold, color = Gold); Text("Selection: one equal random chance"); Text("Token account: " + burn.tokenAccount.take(6) + "…" + burn.tokenAccount.takeLast(4)); Text("One signer • one burn instruction • Token-2022 verified"); Text("Your wallet will show the final transaction before signing. The burn is irreversible once confirmed on-chain.", color = androidx.compose.ui.graphics.Color.LightGray) } } }
                item { Button(onClick = { confirmBurn = true }, modifier = Modifier.fillMaxWidth(), enabled = entryTitle.isNotBlank() && !submitting && !completed) { Text(if (completed) "Contest entry submitted" else "Burn $3 worth & submit") } }
            }
        }
    }

    if (confirmBurn) {
        AlertDialog(
            onDismissRequest = { if (!submitting) confirmBurn = false },
            title = { Text("Confirm contest entry") },
            text = { Text("This will ask your wallet to sign a transaction burning $3 worth of SPARKD. The exact quoted amount is ${prepared?.takeIf { it.burnAmount > 0 }?.let { formatSparkdEntryAmount(it.burnAmount) } ?: "shown in the review"} SPARKD. Every eligible meme receives one equal chance in the draw. Do not approve unless you reviewed the exact amount.") },
            dismissButton = { TextButton(onClick = { confirmBurn = false }, enabled = !submitting) { Text("Cancel") } },
            confirmButton = { Button(onClick = {
                confirmBurn = false; submitting = true
                scope.launch {
                    val burn = prepared; val record = forge; val png = bytes
                    runCatching { finalizeWithNewBurn(requireNotNull(burn), requireNotNull(record), requireNotNull(png)) }.onSuccess { finishSuccess(it) }.onFailure { error -> status = if (recovery.pending() != null) "Submission did not finish, but the signed burn is saved for recovery. DO NOT BURN AGAIN. Tap submit again to resume safely. " + (error.message ?: "") else error.message ?: "Contest submission failed before a signed burn was saved." }
                    submitting = false
                }
            }, enabled = entryTitle.isNotBlank() && !submitting) { Text("Confirm $3 SPARKD entry burn") } }
        )
    }
}
