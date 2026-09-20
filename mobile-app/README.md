# SPARKD Mobile Preview

Dedicated Android app source for SPARKD. This branch is intentionally DISCONNECTED from production until owner approval.

Phone-first screens: Home, Meme Forge, Contest, Winners, Profile. The Forge creates a local PNG preview. Production voting, wallet signing, burns, uploads and database writes are disabled in this preview.

Build with JDK 17: `gradle :app:assembleDebug`.

Production cutover will connect the approved UI to the existing SPARKD contest services and Phantom/Mobile Wallet Adapter, test against a non-production contest, then publish the signed APK.

The existing `meme-forge-mobile` folder is intentionally retained until approval/cutover so the working site is not disturbed.
