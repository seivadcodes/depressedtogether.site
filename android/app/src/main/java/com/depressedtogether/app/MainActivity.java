package com.depressedtogether.app;

import com.getcapacitor.BridgeActivity;
import android.webkit.PermissionRequest;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    protected void init() {
        super.init();
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Only allow audio and video capture permissions
                String[] resources = request.getResources();
                boolean allowed = true;
                for (String resource : resources) {
                    if (!(
                        PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource) ||
                        PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    )) {
                        allowed = false;
                        break;
                    }
                }
                if (allowed) {
                    request.grant(resources);
                } else {
                    request.deny();
                }
            }
        });
    }
}