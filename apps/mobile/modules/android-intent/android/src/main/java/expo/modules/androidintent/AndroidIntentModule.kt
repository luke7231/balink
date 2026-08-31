package expo.modules.androidintent

import android.content.Intent
import android.net.Uri
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AndroidIntentModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AndroidIntent")

    AsyncFunction("openIntentUri") { uri: String ->
      val activity =
        appContext.activityProvider?.currentActivity
          ?: throw IllegalStateException("No current activity")

      val intent = Intent.parseUri(uri, Intent.URI_INTENT_SCHEME)
      // Android 11+ 에서 resolveActivity 가 queries 누락으로 null 을 주는 경우가 있어
      // 먼저 startActivity 를 시도한다.
      try {
        activity.startActivity(intent)
        Log.i(TAG, "started intent action=${intent.action} package=${intent.`package`}")
        return@AsyncFunction true
      } catch (error: Exception) {
        Log.w(TAG, "startActivity failed: ${error.message}")
      }

      val fallback = intent.getStringExtra("browser_fallback_url")
      if (!fallback.isNullOrBlank()) {
        activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(fallback)))
        return@AsyncFunction true
      }

      false
    }
  }

  companion object {
    private const val TAG = "BalinkAndroidIntent"
  }
}
