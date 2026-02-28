package com.pawtential.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Get the WebView and configure it
        WebView webView = this.getBridge().getWebView();
        
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable JavaScript and DOM storage
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            
            // Allow mixed content (HTTP in HTTPS)
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Enable caching
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Set a custom WebViewClient to handle links internally
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    // If the URL is our app domain, load it in WebView
                    if (url.contains("pawtential.vercel.app") || 
                        url.contains("localhost") ||
                        url.startsWith("file://")) {
                        return false; // Let WebView handle it
                    }
                    
                    // For external URLs, open in browser
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }
            });
        }
    }
    
    @Override
    public void onBackPressed() {
        WebView webView = this.getBridge().getWebView();
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
