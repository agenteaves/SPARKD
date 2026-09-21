package com.sparkd.community

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.json.JSONObject
import java.security.SecureRandom
import java.time.Instant
import java.util.zip.CRC32

data class ForgeDnaRecord(
    val forge: String = "SPARKD Meme Forge", val version: String = "1.1",
    val memeID: String, val DNA: String, val imageFingerprint: String, val imageLock: String,
    val created: String, val contract: String = "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump",
    val creatorID: String, val wallet: String, val reputation: Int = 100, val signature: String
)

object ForgeDna {
    private val random = SecureRandom()
    private const val alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    fun create(png: ByteArray, creatorId: String, wallet: String?): ForgeDnaRecord {
        val bitmap = BitmapFactory.decodeByteArray(png, 0, png.size) ?: error("Unable to read the Forge image.")
        val fingerprint = pixelFingerprint(bitmap)
        val base = linkedMapOf<String, Any>(
            "forge" to "SPARKD Meme Forge", "version" to "1.1", "memeID" to id("SPK-", 12),
            "DNA" to dna(), "imageFingerprint" to fingerprint, "imageLock" to fingerprint,
            "created" to Instant.now().toString(), "contract" to "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump",
            "creatorID" to creatorId, "wallet" to (wallet ?: "NOT_CONNECTED"), "reputation" to 100
        )
        val signature = "SIG-" + hexAbs(jsHash(canonical(base, true)))
        return ForgeDnaRecord(
            memeID = base.getValue("memeID") as String, DNA = base.getValue("DNA") as String,
            imageFingerprint = fingerprint, imageLock = fingerprint, created = base.getValue("created") as String,
            creatorID = creatorId, wallet = base.getValue("wallet") as String, signature = signature
        )
    }

    fun embed(png: ByteArray, record: ForgeDnaRecord): ByteArray {
        val fields = linkedMapOf<String, Any>(
            "forge" to record.forge, "version" to record.version, "memeID" to record.memeID,
            "DNA" to record.DNA, "imageFingerprint" to record.imageFingerprint, "imageLock" to record.imageLock,
            "created" to record.created, "contract" to record.contract, "creatorID" to record.creatorID,
            "wallet" to record.wallet, "reputation" to record.reputation, "signature" to record.signature
        )
        return insertTextChunk(png, "SPARKD-FORGE", canonical(fields, false))
    }

    fun newCreatorId(): String = id("CREATOR-", 8)
    private fun id(prefix: String, length: Int): String = buildString {
        append(prefix); repeat(length) { append(alphabet[random.nextInt(alphabet.length)]) }
    }
    private fun dna(): String = "DNA-" + hexAbs(jsHash(System.currentTimeMillis().toString()))

    private fun pixelFingerprint(bitmap: Bitmap): String {
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        var hash = 0
        for (pixel in pixels) for (value in intArrayOf(
            (pixel shr 16) and 255, (pixel shr 8) and 255, pixel and 255, (pixel ushr 24) and 255
        )) hash = (hash shl 5) - hash + value
        return "IMG-" + hexAbs(hash)
    }

    private fun jsHash(text: String): Int {
        var hash = 0; text.forEach { hash = (hash shl 5) - hash + it.code }; return hash
    }
    private fun hexAbs(value: Int): String {
        val absolute = if (value < 0) -value.toLong() else value.toLong()
        return absolute.toString(16).uppercase()
    }
    private fun canonical(values: Map<String, Any>, sort: Boolean): String {
        val entries = if (sort) values.toSortedMap() else values
        return entries.entries.joinToString(prefix = "{", postfix = "}") { entry ->
            "\"" + entry.key + "\":" + when (val value = entry.value) {
                is String -> JSONObject.quote(value); else -> value.toString()
            }
        }
    }

    private fun insertTextChunk(png: ByteArray, keyword: String, text: String): ByteArray {
        require(png.size >= 20 && png.copyOfRange(0, 8).contentEquals(byteArrayOf(137.toByte(),80,78,71,13,10,26,10))) { "Forge image is not a PNG." }
        val iend = png.size - 12
        require(String(png, iend + 4, 4, Charsets.ISO_8859_1) == "IEND") { "Invalid PNG ending." }
        val data = (keyword + "\u0000" + text).toByteArray(Charsets.UTF_8)
        val type = "tEXt".toByteArray(Charsets.ISO_8859_1)
        val chunk = ByteArray(12 + data.size)
        writeInt(chunk, 0, data.size); System.arraycopy(type, 0, chunk, 4, 4); System.arraycopy(data, 0, chunk, 8, data.size)
        val crc = CRC32().apply { update(type); update(data) }.value.toInt()
        writeInt(chunk, 8 + data.size, crc)
        return png.copyOfRange(0, iend) + chunk + png.copyOfRange(iend, png.size)
    }
    private fun writeInt(target: ByteArray, offset: Int, value: Int) {
        target[offset] = (value ushr 24).toByte(); target[offset+1] = (value ushr 16).toByte()
        target[offset+2] = (value ushr 8).toByte(); target[offset+3] = value.toByte()
    }
}
