package com.sparkd.community

/**
 * Single source of truth for the Android Forge -> Submit handoff.
 *
 * A contest entry must use the latest verified PNG produced by this app's
 * Meme Forge. The Submit screen must never replace it with a gallery image.
 * Content moderation remains in the Forge before an export is created, so a
 * blocked image never becomes an eligible Forge export.
 */
object MobileForgeSubmissionBridge {
    data class SubmissionAsset(
        val png: ByteArray,
        val forge: ForgeDnaRecord
    )

    fun current(): SubmissionAsset? {
        val png = ForgeDraft.exportedPng ?: return null
        val forge = ForgeDraft.exportedRecord ?: return null
        if (png.isEmpty()) return null
        return SubmissionAsset(png.copyOf(), forge)
    }

    fun requireCurrent(): SubmissionAsset = current()
        ?: error("Create an allowed meme in the SPARKD Meme Forge before submitting.")

    fun installVerifiedExport(png: ByteArray, forge: ForgeDnaRecord) {
        require(png.isNotEmpty()) { "Verified Forge PNG is empty." }
        ForgeDraft.exportedPng = png.copyOf()
        ForgeDraft.exportedRecord = forge
    }

    fun clear() {
        ForgeDraft.exportedPng = null
        ForgeDraft.exportedRecord = null
    }
}
