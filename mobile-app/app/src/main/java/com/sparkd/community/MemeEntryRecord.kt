package com.sparkd.community

import java.security.SecureRandom

data class MemeEntryRecord(val memeID: String, val creatorID: String, val wallet: String)

/** IDs identify burn receipts; they are never embedded in image files. */
object MemeEntryIds {
    private val random = SecureRandom()
    private const val alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    fun newCreatorId(): String = newId("CREATOR-", 8)
    fun newRecord(creatorId: String, wallet: String): MemeEntryRecord =
        MemeEntryRecord(newId("SPK-", 12), creatorId, wallet)
    private fun newId(prefix: String, length: Int): String = buildString {
        append(prefix)
        repeat(length) { append(alphabet[random.nextInt(alphabet.length)]) }
    }
}
