package com.barpi.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView to allow mixed content (HTTP and HTTPS)
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}
