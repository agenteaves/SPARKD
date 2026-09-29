package com.sparkd.community

import android.content.Context
import android.graphics.BitmapFactory
import android.util.AtomicFile
import org.json.JSONObject
import java.io.File

/** Keeps the selected plain PNG and its burn-recovery ID inside the app. */
internal object ForgeExportStore {
    private const val IMAGE = "latest-forge-entry.png"
    private const val RECORD = "latest-forge-entry.json"
    private const val MAX_BYTES = 10 * 1024 * 1024

    fun save(context: Context, png: ByteArray, record: MemeEntryRecord): MemeEntryRecord {
        require(png.size in 1..MAX_BYTES) { "Contest PNG must be 10 MB or smaller." }
        require(BitmapFactory.decodeByteArray(png, 0, png.size) != null) { "The selected image could not be displayed." }
        write(File(context.filesDir, IMAGE), png)
        val json = JSONObject().put("memeID", record.memeID)
            .put("creatorID", record.creatorID).put("wallet", record.wallet)
        write(File(context.filesDir, RECORD), json.toString().toByteArray(Charsets.UTF_8))
        return record
    }

    fun load(context: Context): Pair<ByteArray, MemeEntryRecord>? {
        val image = File(context.filesDir, IMAGE)
        if (!image.exists()) return null
        require(image.length() in 1..MAX_BYTES.toLong()) { "Saved meme has an invalid size." }
        val png = AtomicFile(image).openRead().use { it.readBytes() }
        require(BitmapFactory.decodeByteArray(png, 0, png.size) != null) { "The saved meme image cannot be displayed." }
        val recordFile = File(context.filesDir, RECORD)
        val record = if (recordFile.exists()) {
            val json = JSONObject(AtomicFile(recordFile).openRead().use { it.readBytes() }.toString(Charsets.UTF_8))
            MemeEntryRecord(json.getString("memeID"), json.getString("creatorID"), json.getString("wallet"))
        } else {
            // Existing users may have an approved burn tied to an older PNG.
            // Read its original receipt ID solely for recovery; new exports are plain PNGs.
            recoverLegacyReceiptIdentity(png)
        }
        return png to record
    }

    private fun recoverLegacyReceiptIdentity(png: ByteArray): MemeEntryRecord {
        var offset = 8
        while (offset + 12 <= png.size) {
            val length = ((png[offset].toInt() and 255) shl 24) or
                ((png[offset + 1].toInt() and 255) shl 16) or
                ((png[offset + 2].toInt() and 255) shl 8) or (png[offset + 3].toInt() and 255)
            require(length >= 0 && length <= png.size - offset - 12) { "Saved PNG is damaged." }
            val type = String(png, offset + 4, 4, Charsets.ISO_8859_1)
            if (type == "tEXt") {
                val data = png.copyOfRange(offset + 8, offset + 8 + length)
                val zero = data.indexOf(0.toByte())
                if (zero > 0 && String(data, 0, zero, Charsets.UTF_8) == "SPARKD-FORGE") {
                    val json = JSONObject(String(data, zero + 1, data.size - zero - 1, Charsets.UTF_8))
                    return MemeEntryRecord(json.getString("memeID"), json.getString("creatorID"), json.getString("wallet"))
                }
            }
            offset += length + 12
            if (type == "IEND") break
        }
        error("A previously saved burn cannot be matched to this image. Contact SPARKD support with the burn transaction.")
    }

    private fun write(file: File, bytes: ByteArray) {
        val atomic = AtomicFile(file)
        val output = atomic.startWrite()
        try { output.write(bytes); atomic.finishWrite(output) }
        catch (error: Exception) { atomic.failWrite(output); throw error }
    }

    fun clear(context: Context) {
        AtomicFile(File(context.filesDir, IMAGE)).delete()
        AtomicFile(File(context.filesDir, RECORD)).delete()
    }
}
