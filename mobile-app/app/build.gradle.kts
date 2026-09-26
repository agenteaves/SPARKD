plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.compose") }
android {
 namespace="com.sparkd.community"; compileSdk=35
 defaultConfig { applicationId="com.sparkd.community"; minSdk=26; targetSdk=35; versionCode=38; versionName="1.0.35" }
 compileOptions { sourceCompatibility=JavaVersion.VERSION_17; targetCompatibility=JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget="17" }
 buildFeatures { compose=true }
 lint { disable.add("NullSafeMutableLiveData") }
 signingConfigs {
  val storeFilePath = providers.gradleProperty("SPARKD_RELEASE_STORE_FILE").orNull
  val storePassword = providers.gradleProperty("SPARKD_RELEASE_STORE_PASSWORD").orNull
  val keyAlias = providers.gradleProperty("SPARKD_RELEASE_KEY_ALIAS").orNull
  val keyPassword = providers.gradleProperty("SPARKD_RELEASE_KEY_PASSWORD").orNull
  if (storeFilePath != null && storePassword != null && keyAlias != null && keyPassword != null) {
   create("release") { storeFile = file(storeFilePath); this.storePassword = storePassword; this.keyAlias = keyAlias; this.keyPassword = keyPassword }
  }
 }
 buildTypes {
  getByName("release") { signingConfigs.findByName("release")?.let { signingConfig = it }; isMinifyEnabled = false }
 }
}
dependencies {
 implementation(platform("androidx.compose:compose-bom:2025.05.01"))
 implementation("androidx.activity:activity-compose:1.10.1")
 implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.1")
 implementation("com.solanamobile:mobile-wallet-adapter-clientlib-ktx:2.0.7")
 implementation("androidx.compose.material3:material3")
 implementation("androidx.compose.material:material-icons-extended")
 implementation("androidx.compose.ui:ui")
 implementation("androidx.compose.ui:ui-tooling-preview")
 debugImplementation("androidx.compose.ui:ui-tooling")
}
