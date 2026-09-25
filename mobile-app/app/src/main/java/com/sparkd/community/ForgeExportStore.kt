package com.sparkd.community

import android.content.Context
import android.util.AtomicFile
import java.io.File

/** Retains the exact Forge export inside the app so photo providers cannot rewrite it. */
internal object ForgeExportStore {
    private const val NAME = "latest-forge-entry.png"
    private const val MAX_BYTES = 10 * 1024 * 1024

    fun save(context: Context, png: ByteArray): ForgeDnaRecord {
        require(png.size in 1..MAX_BYTES) { "Contest PNG must be 10 MB or smaller." }
        val record = ForgeDna.extractAndVerify(png)
        val file = AtomicFile(File(context.filesDir, NAME))
        val output = file.startWrite()
        try {
            output.write(png)
            file.finishWrite(output)
        } catch (error: Exception) {
            file.failWrite(output)
            throw error
        }
        return record
    }

    fun load(context: Context): Pair<ByteArray, ForgeDnaRecord>? {
        val file = File(context.filesDir, NAME)
        if (!file.exists()) return null
        require(file.length() in 1..MAX_BYTES.toLong()) { "Saved Forge PNG has an invalid size." }
        val bytes = AtomicFile(file).openRead().use { it.readBytes() }
        return bytes to ForgeDna.extractAndVerify(bytes)
    }

    fun clear(context: Context) {
        AtomicFile(File(context.filesDir, NAME)).delete()
    }
}
