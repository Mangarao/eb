package com.aarohisewing.embrobuddy

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "EmbroBuddy"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Fix for react-native-screens crash on Android 16 Beta
   * Prevents crashes during activity lifecycle transitions
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    try {
      super.onCreate(null)
      handleIntent(intent)
    } catch (e: Exception) {
      // Fallback if there's an issue with savedInstanceState
      super.onCreate(savedInstanceState)
      handleIntent(intent)
    }
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  override fun onResume() {
    try {
      super.onResume()
    } catch (e: Exception) {
      // Prevent crashes during resume lifecycle
      e.printStackTrace()
    }
  }

  private fun handleIntent(intent: Intent?) {
    if (intent?.action == Intent.ACTION_VIEW) {
      intent.data?.let { uri ->
        // Store the URI for React Native to pick up
        setIntent(Intent(intent).apply {
          putExtra("fileUri", uri.toString())
        })
      }
    }
  }
}
