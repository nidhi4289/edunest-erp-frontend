package com.edunest.erp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

public class EdunestFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "EdunestFCMService";

    // SharedPreferences keys
    private static final String PREFS_NAME = "edunest_notifications";
    private static final String KEY_NOTIFICATIONS = "notifications";
    private static final String KEY_DELETED_IDS = "deleted_notification_ids";
    private static final String KEY_DELETED_TITLE_BODY = "deleted_notification_title_body";

    // Notification channel
    private static final String CHANNEL_ID = "edunest_default_channel";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        // ⚠️ DO NOT call super.onMessageReceived() – it does nothing, but we keep it harmless
        Log.d(TAG, "[FCM] Notification received!");

        try {
            // Log notification block (if present)
            if (remoteMessage.getNotification() != null) {
                Log.d(TAG, "[FCM] notification block: title="
                        + remoteMessage.getNotification().getTitle()
                        + ", body=" + remoteMessage.getNotification().getBody());
            } else {
                Log.d(TAG, "[FCM] notification block: null");
            }

            // Log data block
            Map<String, String> data = remoteMessage.getData();
            if (data != null && !data.isEmpty()) {
                Log.d(TAG, "[FCM] data block: " + data);
            } else {
                Log.d(TAG, "[FCM] data block: empty or null");
            }

            // 1️⃣ Save to SharedPreferences (for your JS bridge)
            saveNotification(remoteMessage);
            Log.d(TAG, "[FCM] Notification saved to SharedPreferences.");

            // 2️⃣ Forward to Capacitor Push plugin so JS listeners fire
            try {
                PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
                Log.d(TAG, "[FCM] Forwarded remoteMessage to PushNotificationsPlugin");
            } catch (Exception e) {
                Log.e(TAG, "[FCM] Error forwarding to PushNotificationsPlugin", e);
            }

            // 3️⃣ Show OS notification (tray + sound), for BOTH foreground & background
            showSystemNotification(remoteMessage);

        } catch (Exception e) {
            Log.e(TAG, "[FCM] Exception in onMessageReceived", e);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "[FCM] New token: " + token);
        // Forward to Capacitor so your JS token logic still works
        try {
            PushNotificationsPlugin.onNewToken(token);
            Log.d(TAG, "[FCM] Forwarded new token to PushNotificationsPlugin");
        } catch (Exception e) {
            Log.e(TAG, "[FCM] Error forwarding token to PushNotificationsPlugin", e);
        }
    }

    /**
     * Build & show a system notification (tray + sound) using our own channel.
     * Works for both foreground & background when using DATA-ONLY messages.
     */
    private void showSystemNotification(RemoteMessage remoteMessage) {
        createNotificationChannelIfNeeded();

        String title = "EduNest ERP";
        String body = "";

        // Prefer data payload fields (since we’ll send data-only)
        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (data.containsKey("title")) {
                title = data.get("title");
            }
            if (data.containsKey("body")) {
                body = data.get("body");
            }
        } else if (remoteMessage.getNotification() != null) {
            // Fallback if someone still sends a notification message from console
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher) // make sure this exists
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        NotificationManagerCompat manager = NotificationManagerCompat.from(this);
        int id = (int) (System.currentTimeMillis() & 0x7FFFFFFF);
        manager.notify(id, builder.build());

        Log.d(TAG, "[FCM] System notification shown: " + title + " | " + body);
    }

    private void createNotificationChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            NotificationChannel existing = manager.getNotificationChannel(CHANNEL_ID);
            if (existing == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "EduNest Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("EduNest ERP notifications");
                manager.createNotificationChannel(channel);
                Log.d(TAG, "[FCM] Notification channel created");
            }
        }
    }

    /**
     * Your existing saveNotification, unchanged except for logs.
     */
    private void saveNotification(RemoteMessage remoteMessage) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String notificationsJson = prefs.getString(KEY_NOTIFICATIONS, "[]");
        String deletedIdsJson = prefs.getString(KEY_DELETED_IDS, "[]");
        String deletedTitleBodyJson = prefs.getString(KEY_DELETED_TITLE_BODY, "[]");

        try {
            JSONArray notifications = new JSONArray(notificationsJson);
            JSONArray deletedIds = new JSONArray(deletedIdsJson);
            JSONArray deletedTitleBody = new JSONArray(deletedTitleBodyJson);

            JSONObject notificationObj = new JSONObject();

            // Notification payload
            String title = "";
            String body = "";

            if (remoteMessage.getNotification() != null) {
                if (remoteMessage.getNotification().getTitle() != null) {
                    title = remoteMessage.getNotification().getTitle();
                }
                if (remoteMessage.getNotification().getBody() != null) {
                    body = remoteMessage.getNotification().getBody();
                }
            }

            // Prefer data if present
            Map<String, String> data = remoteMessage.getData();
            JSONObject dataObj = (data != null && !data.isEmpty()) ? new JSONObject(data) : new JSONObject();
            if (dataObj.has("title")) title = dataObj.optString("title", title);
            if (dataObj.has("body")) body = dataObj.optString("body", body);

            notificationObj.put("title", title);
            notificationObj.put("body", body);
            notificationObj.put("data", dataObj);

            // Unique id
            String notificationId = String.valueOf(System.currentTimeMillis());
            notificationObj.put("id", notificationId);
            notificationObj.put("timestamp", System.currentTimeMillis());

            // Duplicate / deleted checks – keep as-is if you want
            boolean isDuplicate = false;
            boolean isDeleted = false;

            for (int i = 0; i < notifications.length(); i++) {
                JSONObject existing = notifications.getJSONObject(i);
                if (existing.optString("title").equals(title)
                        && existing.optString("body").equals(body)
                        && existing.optJSONObject("data").toString().equals(dataObj.toString())) {
                    isDuplicate = true;
                    break;
                }
            }

            for (int i = 0; i < deletedIds.length(); i++) {
                if (notificationId.equals(deletedIds.optString(i))) {
                    isDeleted = true;
                    break;
                }
            }

            for (int i = 0; i < deletedTitleBody.length(); i++) {
                JSONObject obj = deletedTitleBody.optJSONObject(i);
                if (obj != null && obj.optString("title").equals(title)
                        && obj.optString("body").equals(body)) {
                    isDeleted = true;
                    break;
                }
            }

            if (!isDuplicate && !isDeleted) {
                notifications.put(notificationObj);
                prefs.edit()
                        .putString(KEY_NOTIFICATIONS, notifications.toString())
                        .apply();
                Log.d(TAG, "[FCM] Notification saved with id: " + notificationId + ", JSON: " + notificationObj);
            } else {
                Log.d(TAG, "[FCM] Duplicate or deleted notification not saved: " + notificationObj);
            }

        } catch (JSONException e) {
            Log.e(TAG, "[FCM] Error saving notification", e);
        }
    }

    public static JSONArray getSavedNotifications(Context context) {
        SharedPreferences prefs =
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String notificationsJson = prefs.getString(KEY_NOTIFICATIONS, "[]");
        try {
            return new JSONArray(notificationsJson);
        } catch (JSONException e) {
            Log.e(TAG, "[FCM] Error reading saved notifications", e);
            return new JSONArray();
        }
    }

    @Override
    public void onSendError(@NonNull String msgId, @NonNull Exception exception) {
        Log.w(TAG, "[FCM] Upstream send error for msgId=" + msgId, exception);
    }
}
