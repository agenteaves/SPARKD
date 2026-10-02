# SPARKD native iPhone app (work in progress)

This is a SwiftUI iPhone application, separate from the Android APK and website. It currently selects a photo, adds two captions and the SPARKD watermark, renders a 1080 × 1080 PNG, and shares/saves the result through iOS. It has no browser view.

**Contest submission is intentionally disabled.** The existing site uses a multi-step Phantom wallet connection, signed Solana burn, server verification, Forge identity validation and recovery of orphaned burns. A native implementation must preserve these exact checks and pass end-to-end tests on a physical iPhone before the submission button is enabled. Never embed a wallet seed phrase or service-role key in the app.

To generate the Xcode project on macOS, install Xcode and XcodeGen, run `xcodegen generate` inside this directory, then open `SPARKDNative.xcodeproj`. Set a valid signing team and bundle identifier. Building and distribution require macOS/Xcode and Apple signing. This repository does not include a signed IPA or an App Store/TestFlight listing.

Do not link this unfinished build from the public homepage. Android remains untouched.
