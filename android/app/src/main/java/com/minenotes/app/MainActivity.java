package com.minenotes.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && "text/plain".equals(type)) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                sendEventToWeb("mine_notes_incoming_share", JSONObject.quote(sharedText));
            }
        } else if (intent.getBooleanExtra("quick_note", false)) {
            sendEventToWeb("mine_notes_quick_note", "{}");
        }
    }

    private void sendEventToWeb(String eventName, String jsonPayload) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() -> {
                String script = "window.dispatchEvent(new CustomEvent('" + eventName + "', { detail: " + jsonPayload + " }));";
                getBridge().eval(script, null);
            });
        }
    }
}
