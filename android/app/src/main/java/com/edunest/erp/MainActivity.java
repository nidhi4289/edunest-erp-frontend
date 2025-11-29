package com.edunest.erp;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.edunest.erp.NotificationBridge; 

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // 🔥 Register your custom plugin here
        registerPlugin(NotificationBridge.class);
        super.onCreate(savedInstanceState);

        // Optional but useful: see console logs in Android Studio
        WebView.setWebContentsDebuggingEnabled(true);

      
    }
}
