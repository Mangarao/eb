package com.aarohisewing.embrobuddy

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
// Native module imports
import com.reactnativecommunity.slider.ReactSliderPackage
import com.ReactNativeBlobUtil.ReactNativeBlobUtilPackage
import com.reactnativedocumentpicker.RNDocumentPickerPackage
import com.rnfs.RNFSPackage
import com.th3rdwave.safeareacontext.SafeAreaContextPackage
import com.swmansion.rnscreens.RNScreensPackage
import cl.json.RNSharePackage
import com.oblador.vectoricons.VectorIconsPackage
import com.rnziparchive.RNZipArchivePackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
          return listOf(
            ReactSliderPackage(),
            ReactNativeBlobUtilPackage(),
            RNDocumentPickerPackage(),
            RNFSPackage(),
            SafeAreaContextPackage(),
            RNScreensPackage(),
            RNSharePackage(),
            VectorIconsPackage(),
            RNZipArchivePackage()
          )
        }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }
}