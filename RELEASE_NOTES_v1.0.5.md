# EmbroBuddy v1.0.6 Release Notes

## Version Information
- **Version Name**: 1.0.6
- **Version Code**: 7
- **Release Date**: February 20, 2026
- **Build Type**: Production (Signed AAB)
- **File**: app-release.aab
- **Size**: ~23 MB

## What's New in v1.0.6

### 🔧 Critical Fix: 16KB Page Size Support
- **FIXED**: "Your app does not support 16 KB memory page sizes" error
- **Added**: Proper 16KB page size configuration using `<property>` tag
- **Configuration**: JNI and DEX packaging optimized for 16KB alignment
- **Compatibility**: Android 15+ with 16KB memory pages fully supported
- **Google Play**: Now passes all Play Console validation checks

This update ensures compatibility with newer Android devices that use 16KB memory page sizes, a requirement for Google Play Store.

---

## Previous Features (v1.0.5)

### 🎨 Enhanced Visualization
- **Vibrant Color Rendering**: Embroidery designs now display with 10 vibrant colors instead of black/white
- **True View Mode**: Connected line rendering with enhanced visual quality
- **Better Preview Images**: Improved color accuracy and stitch representation

### 📤 Comprehensive Sharing Features
- **Multiple Sharing Options**: Share via WhatsApp, Gmail, or any app on your device
- **Image Sharing**: Share generated preview images directly
- **File Sharing**: Share converted embroidery files with original filenames
- **Batch Analyzer Sharing**: Download and share both images and files from batch analysis

### 📥 Improved Downloads
- **Android 10+ Compatibility**: Fixed download functionality using MediaStore API
- **Original Filenames**: Downloads now preserve your original file names
- **Downloads Folder**: All files properly saved to Android Downloads folder

### 💼 New Menu Features
- **Video Courses**: Access embroidery tutorial videos
- **Training Resources**: Learn embroidery techniques
- **Machine Guides**: Information about different embroidery machines
- **Tips & Tricks**: Quick embroidery tips
- **Materials Guide**: Information about threads and fabrics
- **Custom Design Service**: Request custom embroidery designs

### 🛠️ Technical Improvements
- **Better Error Messages**: User-friendly error messages for unsupported formats
- **Format Validation**: Clear feedback on supported file formats
- **Enhanced Logging**: Improved error tracking for better support
- **Performance Optimization**: Faster file processing and analysis

### 📦 Batch Analyzer Enhancements
- **Download Options**: Download analyzed images and original files
- **Share Options**: Share images and files directly from batch results
- **Better Organization**: Improved file handling with original references

### 🔧 Bug Fixes
- Fixed file conversion preserving original filenames
- Fixed download issues on Android 10 and above
- Improved error handling for corrupted files
- Fixed stream errors for unsupported file formats
- Better network error detection and messages

### 🎯 Backend Improvements
- Permanent storage of user uploads (organized by date and screen)
- Automatic cleanup of temporary files
- Enhanced file format validation
- Better error messages from server

## Supported Embroidery Formats
- DST (Tajima)
- JEF (Janome)
- PES (Brother)
- EXP (Melco)
- VP3 (Pfaff)
- XXX (Singer)
- PEC (Brother)
- HUS (Husqvarna)
- SEW (Janome)

## Technical Details
- React Native 0.74.5
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 34 (Android 14)
- 16KB page size support enabled
- Proguard/R8 optimization enabled

## Installation Requirements
- Android 7.0 (API 24) or higher
- ~50 MB free space
- Internet connection for file analysis

## Permissions
- Storage: Save and access embroidery files
- Internet: Connect to analysis server

## Google Play Store Submission Checklist
- [x] Version bumped: 1.0.4 → 1.0.5
- [x] Version code incremented: 5 → 6
- [x] Signed with release key
- [x] ProGuard enabled
- [x] AAB format (not APK)
- [x] 16KB page size support
- [x] Tested on physical device
- [x] All features working
- [x] No console errors in production

## Deployment Steps
1. Login to Google Play Console
2. Navigate to EmbroBuddy app
3. Go to "Production" → "Create new release"
4. Upload `app-release.aab` from:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
5. Copy release notes (shortened version for Play Store)
6. Review countries/rollout percentage
7. Submit for review

## Short Release Notes for Play Store

```
What's new in v1.0.5:

🎨 Enhanced Visualization
• Vibrant color rendering for embroidery designs
• True View mode with connected lines
• Better preview image quality

📤 Sharing & Downloads
• Share via WhatsApp, Gmail, or any app
• Share images and files from all screens
• Fixed downloads on Android 10+
• Original filenames preserved

💼 New Features
• Video Courses
• Training Resources
• Machine Guides
• Tips & Tricks
• Materials Guide
• Custom Design Service

🛠️ Improvements
• User-friendly error messages
• Better format validation
• Performance optimization
• Bug fixes and stability improvements

Supported formats: DST, JEF, PES, EXP, VP3, XXX, PEC, HUS, SEW
```

## Rollback Plan
If issues are discovered after release:
1. Halt rollout immediately in Play Console
2. Previous version (1.0.4) can be restored
3. Address issues and rebuild
4. Re-submit as 1.0.6

## Contact
- Developer: Aarohi Sewing
- Website: https://aarohisewing.com
- Email: support@aarohisewing.com

---

**Build generated on**: February 20, 2026
**Ready for production deployment** ✅
