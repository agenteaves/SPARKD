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
    val creatorID: String, val wallet: String, val reputation: Int = 100, val signature: String,
    val pngFingerprint: String? = null, val pngSignature: String? = null
)

object ForgeDna {
    private val random = SecureRandom()
    private const val alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    fun create(png: ByteArray, creatorId: String, wallet: String?): ForgeDnaRecord {
        val bitmap = BitmapFactory.decodeByteArray(png, 0, png.size) ?: error("Unable to read the Forge image.")
        val fingerprint = pixelFingerprint(bitmap)
        val encodedFingerprint = pngFingerprint(png)
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
            creatorID = creatorId, wallet = base.getValue("wallet") as String, signature = signature,
            pngFingerprint = encodedFingerprint,
            pngSignature = pngSignature(encodedFingerprint, base.getValue("memeID") as String)
        )
    }

    fun embed(png: ByteArray, record: ForgeDnaRecord): ByteArray {
        val fields = linkedMapOf<String, Any>(
            "forge" to record.forge, "version" to record.version, "memeID" to record.memeID,
            "DNA" to record.DNA, "imageFingerprint" to record.imageFingerprint, "imageLock" to record.imageLock,
            "created" to record.created, "contract" to record.contract, "creatorID" to record.creatorID,
            "wallet" to record.wallet, "reputation" to record.reputation, "signature" to record.signature
        )
        record.pngFingerprint?.let { fields["pngFingerprint"] = it }
        record.pngSignature?.let { fields["pngSignature"] = it }
        return insertTextChunk(png, "SPARKD-FORGE", canonical(fields, false))
    }

    fun extractAndVerify(png: ByteArray): ForgeDnaRecord {
        require(png.size >= 20 && png.copyOfRange(0, 8).contentEquals(byteArrayOf(137.toByte(),80,78,71,13,10,26,10))) {
            "Choose the PNG exported by SPARKD Meme Forge."
        }
        val payloads = mutableListOf<String>()
        var forgeChunkStart = -1
        var forgeChunkEnd = -1
        var offset = 8
        while (offset + 12 <= png.size) {
            val length = readInt(png, offset)
            require(length >= 0 && offset + 12 + length <= png.size) { "SPARKD PNG is damaged." }
            val type = String(png, offset + 4, 4, Charsets.ISO_8859_1)
            if (type == "tEXt") {
                val data = png.copyOfRange(offset + 8, offset + 8 + length)
                val zero = data.indexOf(0.toByte())
                if (zero > 0 && String(data, 0, zero, Charsets.UTF_8) == "SPARKD-FORGE") {
                    payloads += String(data, zero + 1, data.size - zero - 1, Charsets.UTF_8)
                    forgeChunkStart = offset
                    forgeChunkEnd = offset + 12 + length
                }
            }
            offset += 12 + length
            if (type == "IEND") break
        }
        require(payloads.size == 1) { if (payloads.isEmpty()) "No SPARKD Forge DNA was found in this PNG." else "Conflicting SPARKD Forge DNA was found." }
        val json = runCatching { JSONObject(payloads.single()) }.getOrElse { error("SPARKD Forge DNA is corrupted.") }
        val record = ForgeDnaRecord(
            forge = json.getString("forge"), version = json.getString("version"),
            memeID = json.getString("memeID"), DNA = json.getString("DNA"),
            imageFingerprint = json.getString("imageFingerprint"), imageLock = json.getString("imageLock"),
            created = json.getString("created"), contract = json.getString("contract"),
            creatorID = json.getString("creatorID"), wallet = json.getString("wallet"),
            reputation = json.getInt("reputation"), signature = json.getString("signature"),
            pngFingerprint = if (json.has("pngFingerprint")) json.getString("pngFingerprint") else null,
            pngSignature = if (json.has("pngSignature")) json.getString("pngSignature") else null
        )
        check(record.forge == "SPARKD Meme Forge" && record.contract == "BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump") { "This is not an official SPARKD Forge PNG." }
        check(record.imageFingerprint == record.imageLock) { "SPARKD image-lock metadata does not match." }
        val unsigned = linkedMapOf<String, Any>(
            "forge" to record.forge, "version" to record.version, "memeID" to record.memeID,
            "DNA" to record.DNA, "imageFingerprint" to record.imageFingerprint, "imageLock" to record.imageLock,
            "created" to record.created, "contract" to record.contract, "creatorID" to record.creatorID,
            "wallet" to record.wallet, "reputation" to record.reputation
        )
        check(record.signature == "SIG-" + hexAbs(jsHash(canonical(unsigned, true)))) { "SPARKD Forge DNA signature was altered." }
        if (record.pngFingerprint != null) {
            check(record.pngSignature == pngSignature(record.pngFingerprint, record.memeID)) {
                "SPARKD PNG lock signature was altered."
            }
            val originalPng = png.copyOfRange(0, forgeChunkStart) + png.copyOfRange(forgeChunkEnd, png.size)
            check(pngFingerprint(originalPng) == record.pngFingerprint) {
                "The meme PNG changed after leaving SPARKD Meme Forge."
            }
        } else {
            check(record.pngSignature == null) { "SPARKD PNG lock is missing." }
            // Existing exports only have a decoded-pixel lock.
            val bitmap = BitmapFactory.decodeByteArray(png, 0, png.size) ?: error("Unable to decode the selected PNG.")
            check(pixelFingerprint(bitmap) == record.imageLock) { "The meme pixels changed after leaving SPARKD Meme Forge." }
        }
        return record
    }

    private fun pngSignature(fingerprint: String, memeId: String): String =
        "SIG-" + hexAbs(jsHash("$memeId:$fingerprint"))

    private fun pngFingerprint(bytes: ByteArray): String {
        var first = 2166136261L.toInt()
        var second = 0
        for (byte in bytes) {
            val value = byte.toInt() and 255
            first = (first xor value) * 16777619
            second = second * 31 + value
        }
        return "PNG-${bytes.size.toString(16).uppercase()}-" +
            first.toUInt().toString(16).uppercase().padStart(8, '0') + "-" +
            second.toUInt().toString(16).uppercase().padStart(8, '0')
    }

    private fun readInt(source: ByteArray, offset: Int): Int =
        ((source[offset].toInt() and 255) shl 24) or
        ((source[offset + 1].toInt() and 255) shl 16) or
        ((source[offset + 2].toInt() and 255) shl 8) or
        (source[offset + 3].toInt() and 255)

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
