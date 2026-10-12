package com.sparkd.community
import org.junit.Assert.*
import org.junit.Test
import java.io.File
class NativeAppUpdaterTest {
 @Test fun downloadUrlMustStayOnApprovedHttpsHostsAndApkPaths() {
  assertTrue(trustedUpdateUrl("https://www.sparkdcoin.com/downloads/SPARKD-Mobile-1.0.52.apk"))
  assertTrue(trustedUpdateUrl("https://sparkdcoin.com/downloads/SPARKD-Mobile-1.0.52.apk"))
  for (url in listOf("http://sparkdcoin.com/downloads/SPARKD-Mobile-1.apk", "https://evil.example/downloads/SPARKD-Mobile-1.apk", "https://sparkdcoin.com@evil.example/downloads/SPARKD-Mobile-1.apk", "https://sparkdcoin.com:444/downloads/SPARKD-Mobile-1.apk", "https://sparkdcoin.com/downloads/SPARKD-Mobile-../other.apk", "https://sparkdcoin.com/downloads/SPARKD-Mobile-1.apk?redirect=evil", "https://sparkdcoin.com/other/file.apk")) assertFalse(url, trustedUpdateUrl(url))
 }
 @Test fun checksumDetectsTruncatedOrChangedDownloads() {
  val file = File.createTempFile("sparkd-update-", ".apk")
  try {
   file.writeText("abc")
   assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", updateFileSha256(file))
   file.appendText("changed")
   assertNotEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", updateFileSha256(file))
  } finally { file.delete() }
 }
}
