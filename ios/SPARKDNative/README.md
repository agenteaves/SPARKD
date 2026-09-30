# SPARKD native iPhone app (work in progress)

This is a SwiftUI iPhone application, separate from the Android APK and website. It currently selects a photo, adds two captions and the SPARKD watermark, renders a 1080 × 1080 PNG, and shares/saves the result through iOS. It has no browser view.

**Contest submission is intentionally disabled.** The existing site uses a multi-step Phantom wallet connection, signed Solana burn, server verification, Forge identity validation and recovery of orphaned burns. A native implementation must preserve these exact checks and pass end-to-end tests on a physical iPhone before the submission button is enabled. Never embed a wallet seed phrase or service-role key in the app.

To generate the Xcode project on macOS, install Xcode and XcodeGen, run `xcodegen generate` inside this directory, then open `SPARKDNative.xcodeproj`. Set a valid signing team and bundle identifier. Building and distribution require macOS/Xcode and Apple signing. This repository does not include a signed IPA or an App Store/TestFlight listing.

## iPad device preview

The `iphone-app` branch builds an unsigned **device** IPA on GitHub Actions alongside the simulator app. Open the latest successful [Build native iPhone and iPad app](https://github.com/agenteaves/SPARKD/actions/workflows/ios-native-build.yml) run and download the `SPARKD-iPad-Preview-unsigned` artifact. Unzip that artifact to obtain the `.ipa`. This IPA is for Apple ID signing through AltStore Classic; tapping it in Safari alone will not install it. No Apple ID credentials or recovery phrases belong in this repository or in a message to the developer.

On a Windows PC, follow [AltStore's Windows setup](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows), connect and trust the iPad, install AltStore Classic, and enable Developer Mode on the iPad. Transfer the `.ipa` to Files on the iPad and import it in AltStore's My Apps tab while AltServer is running. A free Apple ID installation expires after seven days unless refreshed. This preview tests the editor, PNG export, and sharing; it does not connect a wallet or enter a contest.

Do not link this unfinished build from the public homepage. Android remains untouched.
