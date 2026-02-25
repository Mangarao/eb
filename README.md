# EmbroBuddy Mobile App

React Native mobile app for embroidery file management, analysis, and format conversion.

## Features

- 📱 **File Viewer**: Analyze embroidery files with detailed metrics
  - Stitch count, color count, dimensions
  - Real-time price estimation (₹50-500 per 10k stitches)
  - Production time calculation based on machine speed (350-1200 stitches/min)
  - File preview images
  - Download & share functionality
  
- 📊 **Batch Analyzer**: Process multiple embroidery files
  - Sequential file analysis
  - Expandable file details with previews
  - Total stitch count across all files
  - Individual file metrics
  
- 🔄 **Format Converter**: Convert between embroidery formats
  - Support for 9 major formats
  - Download & share converted files
  - Success confirmation popups
  - Format validation (lowercase/uppercase)
  
- 📦 **ZIP Extractor**: Extract and analyze ZIP archives
  - Automatic extraction
  - Batch analysis of extracted files
  - Support for nested folders

## Supported Formats

- DST (Tajima)
- JEF (Janome)
- PES (Brother)
- EXP (Melco)
- VP3 (Pfaff)
- XXX (Singer)
- PEC (Brother)
- HUS (Husqvarna)
- SEW (Janome)

## Tech Stack

- **Framework**: React Native **0.75.5** (upgraded for 16KB page size support)
- **React**: 18.2.0
- **Navigation**: React Navigation v7 (bottom tabs)
- **JavaScript Engine**: Hermes (enabled)
- **File Handling**: 
  - react-native-document-picker (file selection)
  - react-native-fs (file system access)
  - react-native-blob-util (uploads & downloads)
  - react-native-zip-archive (ZIP extraction)
- **UI Components**: 
  - @react-native-community/slider (range controls)
  - react-native-vector-icons (Material Icons)
- **API**: Axios for Laravel backend communication
- **Build Tools**:
  - Gradle 8.7
  - Android Gradle Plugin 8.6.0
  - Kotlin 1.9.24
  - NDK 26.1.10909125

## Requirements

**Required Software:**
- **Node.js:** >= 18.x (LTS recommended)
- **Java JDK:** 17.0.13+ (Microsoft OpenJDK recommended)
- **React Native CLI:** Installed globally
- **Android Studio:** (for Android development)
  - Android SDK Platform 35 (Android 15)
  - Build Tools 35.0.0
  - NDK 26.1.10909125
- **Xcode:** (for iOS development - macOS only)

**Current Build Configuration:**
- **Gradle:** 8.7
- **Android Gradle Plugin:** 8.6.0
- **Kotlin:** 1.9.24
- **React Native:** 0.75.5 (with 16KB page size support)
- **Min SDK:** 24 (Android 7.0+)
- **Target SDK:** 34 (Android 14)
- **Compile SDK:** 35 (Android 15)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Mangarao/embro-buddy.git
cd embro-buddy/embrobuddy-mobile-app
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is required due to peer dependency conflicts between React Navigation and React Native versions.

### 3. Install iOS Pods (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Configure Backend URL

Update [src/services/api.js](src/services/api.js):

```javascript
// For local development with USB device
const USE_LOCAL = true; // Set to false for VPS

const API_BASE_URL = USE_LOCAL 
  ? 'http://192.168.1.100:8000/api' // Your local IP
  : 'https://api.aarohisewing.com/api'; // VPS
```

### 5. Android Setup

The project is configured for:
- **Package:** `com.aarohisewing.embrobuddy`
- **Min SDK:** 24 (Android 7.0+)
- **Target SDK:** 34 (Android 14)
- **Compile SDK:** 35 (Android 15)
- **Gradle:** 8.7
- **Android Gradle Plugin:** 8.6.0
- **Kotlin:** 1.9.24
- **NDK:** 26.1.10909125
- **React Native:** 0.75.5 (with 16KB page size support)
- **Native Module Linking:** Manual (optimized)

**Enable USB Debugging:**
1. Go to Settings → About Phone → Tap Build Number 7 times
2. Go to Settings → Developer Options → Enable USB Debugging
3. Connect device via USB and accept the prompt

### 6. Run the App

**For local development (with USB device):**

```bash
# Start Metro bundler
npm start

# In another terminal, run on Android
npm run android
```

**For iOS (macOS only):**

```bash
npm run ios
```

## Project Structure

```
embrobuddy-mobile-app/
├── App.jsx                         # Main app with bottom tab navigation
├── index.js                        # Entry point
├── src/
│   ├── components/
│   │   ├── Logo.jsx                # App logo component
│   │   └── Footer.jsx              # Footer with credits
│   ├── screens/
│   │   ├── HomeScreen.jsx          # Welcome screen with feature cards
│   │   ├── ViewerScreen.jsx        # File analysis with price/time estimation
│   │   ├── BatchAnalyzerScreen.jsx # Multiple file analysis
│   │   ├── ConverterScreen.jsx     # Format conversion
│   │   └── ZipExtractorScreen.jsx  # ZIP extraction & analysis
│   └── services/
│       └── api.js                  # Backend API integration
├── android/                        # Android native code
│   ├── app/
│   │   ├── build.gradle            # App-level Gradle config
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Permissions & config
│   │       └── res/                # Resources (icons, strings)
│   └── build.gradle                # Project-level Gradle config
└── package.json                    # Dependencies
```

## Key Features Details

### File Viewer Screen
- **Upload**: Pick any supported embroidery file
- **Analysis**: View stitch count, colors, dimensions, trims
- **Machine Speed Slider**: 350-1200 stitches/min
- **Price Slider**: ₹50-500 per 10,000 stitches
- **Estimated Time**: Auto-calculated based on stitches and speed
- **Estimated Price**: Auto-calculated based on stitches and rate
- **Disclaimers**: Stitch count variance & price estimation warnings
- **Actions**: Download file, Share file, Clear form

### Batch Analyzer Screen
- **Multi-file Upload**: Select multiple embroidery files
- **Sequential Analysis**: Processes files one by one
- **Expandable Details**: Tap to view individual file metrics
- **Preview Images**: Shows embroidery preview for each file
- **Total Summary**: Displays total files and total stitches
- **Actions**: Clear all results

### Converter Screen
- **File Upload**: Select source embroidery file
- **Format Selection**: Choose target format (DST, JEF, PES, etc.)
- **Conversion**: Server-side format conversion
- **Success Popup**: Alert confirmation on successful conversion
- **Actions**: Download converted file, Share file, Clear form
- **Disclaimer**: Hidden after successful conversion

### ZIP Extractor Screen
- **ZIP Upload**: Select ZIP file containing embroidery files
- **Auto-extraction**: Extracts to temp directory
- **Batch Analysis**: Analyzes all extracted files
- **File Details**: Shows results for each file
- **Actions**: Clear results

## Permissions

### Android ([android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml))
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

### iOS (ios/embrobuddy/Info.plist)
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photo library to select embroidery files</string>
```

## API Integration

Base URL configuration in [src/services/api.js](src/services/api.js):

### Endpoints Used

```javascript
// Analyze single file
analyzeFile(file)
POST /api/analyze

// Convert file format
convertFile(file, targetFormat)
POST /api/convert

// Note: Batch analysis is done sequentially (no batch endpoint)
```

### Error Handling

- Network errors: User-friendly error messages
- Invalid files: Format validation before upload
- API errors: Displays server error messages
- Console logging: Extensive logging for debugging

## Building for Production

### 🚀 Quick Build (Standard Release)

**Prerequisites:** All dependencies installed, no package changes

```powershell
# Navigate to android folder
cd android

# Build production AAB
.\gradlew bundleRelease
```

**Build Time:** ~3-5 minutes  
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`  
**Expected Size:** ~26 MB

---

### 📝 Version Update Process

Before each production build, update version numbers in two files:

**1. Update `android/app/build.gradle` (lines 88-89):**
```gradle
defaultConfig {
    applicationId "com.aarohisewing.embrobuddy"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 15        // ← Increment by 1
    versionName "1.0.14"  // ← Update version string
}
```

**2. Update `package.json` (line 3):**
```json
{
  "name": "EmbroBuddy",
  "version": "1.0.14",  // ← Update version string
  "private": true,
```

**Current Version:** 1.0.13 (Build 14)  
**Next Version:** 1.0.14 (Build 15)

---

### 🏗️ Complete Build Instructions

**Step 1: Clean Previous Build**
```powershell
cd android
.\gradlew clean
```

**Step 2: Build Release AAB**
```powershell
.\gradlew bundleRelease
```

**Step 3: Verify Output**
```powershell
Get-ChildItem app\build\outputs\bundle\release\app-release.aab
```

---

### 🧹 Full Clean Build (After Dependency Updates)

**When to use:** After `npm install` or updating native modules

**Step 1: Remove All Build Artifacts**
```powershell
cd C:\Users\marepalli\Desktop\AAROHI\embro-buddy\embrobuddy-mobile-app

# Remove node_modules
Remove-Item node_modules -Recurse -Force

# Remove Android build folders
Remove-Item android\build -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item android\app\build -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item android\.cxx -Recurse -Force -ErrorAction SilentlyContinue
```

**Step 2: Reinstall Dependencies**
```powershell
npm install --legacy-peer-deps
```

**Step 3: Clean and Build**
```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

---

### 📱 16KB Page Size Support (Google Play 2026 Requirement)

**Issue:** Google Play Store now requires all apps with native libraries to support 16KB memory page sizes for modern Android devices.

**Solution:** React Native **0.75.5** includes native 16KB page size support built-in.

#### Why This Matters

| React Native Version | 16KB Support | Google Play Status |
|---------------------|--------------|-------------------|
| 0.74.5 (old) | ❌ No | Rejected with error |
| **0.75.5 (current)** | ✅ Yes | ✅ Approved |
| 0.76.x | ✅ Yes | Requires New Architecture |

#### What's Configured

✅ **Hermes Engine:** Compiled with 16KB alignment (0x4000)  
✅ **Native Libraries:** All React Native modules built with proper alignment  
✅ **NDK Version:** 26.1.10909125 (supports 16KB)  
✅ **Manual Linking:** Native modules manually configured to avoid build issues

**No additional configuration needed** - React Native 0.75.5 handles this automatically.

#### Google Play Upload Process

1. Build AAB: `.\gradlew bundleRelease`
2. Go to [Google Play Console](https://play.google.com/console)
3. Navigate to Release → Production (or Testing)
4. Create new release
5. Upload `app-release.aab`
6. ✅ Google Play automatically validates 16KB support
7. Proceed with rollout

---

### 🔧 Build Troubleshooting

#### Build Hangs at "Evaluating settings"

**Problem:** Gradle initialization stuck for 2+ minutes

**Solution:**
```powershell
cd android
.\gradlew --stop     # Stop all Gradle daemons
.\gradlew bundleRelease
```

#### "Cannot find symbol" Compilation Errors

**Problem:** Package classes not found during Java compilation

**Root Cause:** Native module linking issue (configuration is already correct)

**Solution:**
```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

#### Out of Memory Error

**Problem:** Gradle runs out of heap space during build

**Current Configuration** (android/gradle.properties):
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

**If still failing:**
```powershell
$env:GRADLE_OPTS = "-Xmx4096m"
cd android
.\gradlew bundleRelease
```

#### Metro Bundler Port Conflict

**Problem:** Metro can't start on port 8081

**Solution:**
```powershell
# Kill existing Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start Metro
npm start
```

#### NPM Dependency Conflicts

**Problem:** `npm install` shows peer dependency errors

**Solution:**
```powershell
npm install --legacy-peer-deps
```

---

### ⚙️ Native Module Configuration

This project uses **manual native module linking** to avoid autolinking delays and build issues.

**Configured Native Modules:**
1. `@react-native-community/slider` - Slider component
2. `react-native-blob-util` - File operations
3. `react-native-document-picker` - Document selection
4. `react-native-fs` - File system access
5. `react-native-safe-area-context` - Safe area handling
6. `react-native-screens` - Native navigation
7. `react-native-share` - Share functionality
8. `react-native-vector-icons` - Icon library
9. `react-native-zip-archive` - ZIP handling

**Configuration Files:**
- Module includes: `android/settings.gradle`
- Dependencies: `android/app/build.gradle`
- Package registration: `android/app/src/main/java/com/aarohisewing/embrobuddy/MainApplication.kt`

**⚠️ Important:** Do not enable autolinking - it causes build hangs. The manual configuration is optimized for this project.

---

### 🔐 Code Signing for Release

**Debug Signing:** Uses default Android debug keystore (automatic)

**Release Signing:** Configured via `android/keystore.properties`

Create `android/keystore.properties` file:
```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=your_key_alias
storeFile=../path/to/your-release-key.keystore
```

**Important:** Never commit keystore files or passwords to version control!

---

### Android AAB (for Google Play)

```bash
cd android
./gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### Android APK (for manual distribution)

```bash
cd android
./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

### Signing Configuration

Update [android/app/build.gradle](android/app/build.gradle):

```gradle
signingConfigs {
    release {
        storeFile file('your-release-key.keystore')
        storePassword 'your-password'
        keyAlias 'your-alias'
        keyPassword 'your-password'
    }
}
```

## Development

### Start Metro Bundler

```bash
npm start
```

### Clear Cache

```bash
npm start -- --reset-cache
```

### Clean Build

```bash
cd android
./gradlew clean
cd ..
```

### Rebuild App

```bash
# Delete build folders
rm -rf android/app/build

# Reinstall dependencies
rm -rf node_modules
npm install

# Run app
npm run android
```

## Troubleshooting

### Metro Bundler Issues
```bash
# Reset cache
npm start -- --reset-cache

# Kill existing Metro processes
npx react-native start --reset-cache
```

### Android Build Errors
```bash
# Clean Gradle cache
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### File Picker Not Working
- Check storage permissions in AndroidManifest.xml
- Request runtime permissions for Android 13+
- Verify file types are supported

### API Connection Fails
- Verify backend URL in [src/services/api.js](src/services/api.js)
- Check network permissions
- Test with `http://` for local development
- Ensure device and server are on same network (for local testing)

### Download/Share Not Working
- Check file existence in response
- Verify RNBlobUtil permissions
- Check console logs for errors
- Ensure files are saved to correct directory

### Conversion Fails with "Invalid target format"
- This was fixed in v1.0.0
- Backend now accepts both lowercase and uppercase formats
- Ensure latest backend is deployed

## Testing

### Local Testing Setup

1. **Start backend server:**
   ```bash
   cd embrobuddy-backend
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **Find your local IP:**
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

3. **Update API URL in app:**
   ```javascript
   const API_BASE_URL = 'http://YOUR_LOCAL_IP:8000/api';
   ```

4. **Connect device via USB and run:**
   ```bash
   npm run android
   ```

### VPS Testing

Update [src/services/api.js](src/services/api.js):
```javascript
const USE_LOCAL = false;
const API_BASE_URL = 'https://api.aarohisewing.com/api';
```

## Deployment Information

- **Repository**: https://github.com/Mangarao/embro-buddy (private)
- **Backend VPS**: 119.18.55.169
- **Backend Path**: /opt/embro-buddy/backend
- **Domain**: https://aarohisewing.com
- **Package Name**: com.aarohisewing.embrobuddy

## Changelog

### Version 1.0.13 (February 2026) - **Current**
- 🎯 **Critical Update:** Upgraded React Native 0.74.5 → **0.75.5**
- ✅ **16KB Page Size Support:** Native compliance with Google Play 2026 requirements
- ✅ **Hermes Engine:** Updated to 16KB-aligned version
- ✅ **Native Module Linking:** Configured manual linking to avoid autolinking delays
- ✅ **Build Optimization:** Faster builds with improved Gradle configuration
- ✅ **Google Play Ready:** AAB now passes 16KB validation automatically

### Version 1.0.0 (January 2026)
- Initial release
- File viewer with price & time estimation
- Batch analyzer with expandable details
- Format converter with download/share
- ZIP extractor functionality
- Clear buttons on all screens
- Success popups for conversions
- Dynamic footer positioning
- Comprehensive error handling
- Format validation fix (lowercase/uppercase)

## Future Roadmap

- [ ] Offline analysis capability
- [ ] Embroidery design preview rendering
- [ ] Thread color palette viewer
- [ ] Cloud storage integration
- [ ] Design sharing features
- [ ] Pro features (subscription model)
- [ ] Dark mode support
- [ ] Multi-language support

## License

Proprietary - Aarohi Sewing

## Support

For issues or questions:
- Email: support@aarohisewing.com
- Repository: https://github.com/Mangarao/embro-buddy

## Credits

Developed for Aarohi Sewing Enterprises
© 2026 Aarohi Sewing. All rights reserved.
