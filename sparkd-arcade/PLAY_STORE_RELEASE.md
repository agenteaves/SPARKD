# SPARKD ELITES — Android release checklist

## Current state
The arcade is a hosted HTML/Three.js game. The manifest and SVG icon are a first step toward installable web-app behavior. **They are not an Android APK or AAB.** No Play Store submission has been made.

## Required before production
1. Complete Android package via a maintained Trusted Web Activity (TWA) or native shell, build a signed **Android App Bundle (AAB)**, and test on physical Android devices.
2. Generate raster 192px and 512px PWA icons, a high-resolution Play icon, feature graphic, and phone screenshots. Current SVG is provisional.
3. For TWA, configure Android Digital Asset Links (`/.well-known/assetlinks.json`) on the **hosting origin** to match the app signing certificate and Android package. GitHub Pages deployment under a project path may not give the necessary origin-level control; use a dedicated domain if needed.
4. Implement verified Solana wallet ownership and token balance using the exact mint `BMU2rhUtANRS1hYKC1pQgxjcJ2Pn9PQURcf8CcRVpump`. Derive USD eligibility from a trustworthy price feed and enforce Levels 2–5 server-side. Level 1 including its first boss remains free. Never request token spending approval.
5. Test app lifecycle: cold start resets to Level 1, resume behavior, offline errors, rotation, touch controls, audio, memory, low-end performance, and five-level completion.
6. Implement a privacy policy, support contact, data handling disclosures, Play Data Safety answers, age/content rating, and store listing.
7. Review current Google Play blockchain-content, financial-feature, and real-money prize rules before enabling token gating or weekly rewards. Keep weekly prizes disabled until legal and policy review is complete.
8. Use a Play Console internal test track, fix crashes/ANRs, then complete applicable testing and production review requirements.

## Deployment boundary
Do not change production sparkdcoin.com without explicit authorization. This repository's GitHub Pages arcade is a development build; app-store publication requires separate approval.
