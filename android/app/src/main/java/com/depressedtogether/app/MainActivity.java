package com.depressedtogether.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Configure WebView after bridge is ready
    this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(PermissionRequest request) {
        // Auto-grant mic/camera permissions for your domain
        if (request.getOrigin().toString().startsWith("https://www.depressedtogether.site")) {
          request.grant(request.getResources());
        } else {
          request.deny();
        }
      }
    });

    // Disable cache + enable media
    if (bridge != null && bridge.getWebView() != null) {
      WebView webView = bridge.getWebView();
      WebSettings webSettings = webView.getSettings();
      webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
      webSettings.setAppCacheEnabled(false);
      webSettings.setDomStorageEnabled(true);
      webSettings.setMediaPlaybackRequiresUserGesture(false);
    }
  }
}