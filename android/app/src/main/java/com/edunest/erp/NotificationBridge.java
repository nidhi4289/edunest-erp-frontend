package com.edunest.erp;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "NotificationBridge")
public class NotificationBridge extends Plugin {

    private static final String TAG = "NotificationBridge";

    // keep names in sync with EdunestFirebaseMessagingService
    private static final String PREFS_NAME = "edunest_notifications";
    private static final String KEY_NOTIFICATIONS = "notifications";
    private static final String KEY_DELETED_IDS = "deleted_notification_ids";
    private static final String KEY_DELETED_TITLE_BODY = "deleted_notification_title_body";

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "Plugin loaded by Capacitor");
    }

    /**
     * Return all saved notifications from SharedPreferences
     */
    @PluginMethod
    public void getSavedNotifications(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs =
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String notificationsJson = prefs.getString(KEY_NOTIFICATIONS, "[]");
        Log.d(TAG, "Reading saved notifications: " + notificationsJson);

        JSArray jsArray;
        try {
            jsArray = new JSArray(notificationsJson);
        } catch (JSONException e) {
            Log.e(TAG, "JSON error while parsing notifications", e);
            jsArray = new JSArray(); // empty array fallback
        }

        JSObject ret = new JSObject();
        ret.put("notifications", jsArray);
        call.resolve(ret);
    }

    /**
     * Delete a single notification (by id, or by title+body) from SharedPreferences
     */
    @PluginMethod
    public void deleteNotification(PluginCall call) {
        String notificationId = call.getString("id");
        String title = call.getString("title");
        String body = call.getString("body");

        Context context = getContext();
        SharedPreferences prefs =
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String notificationsJson = prefs.getString(KEY_NOTIFICATIONS, "[]");
        String deletedIdsJson = prefs.getString(KEY_DELETED_IDS, "[]");
        String deletedTitleBodyJson = prefs.getString(KEY_DELETED_TITLE_BODY, "[]");

        try {
            JSONArray jsonArray = new JSONArray(notificationsJson);
            JSONArray updatedArray = new JSONArray();
            JSONArray deletedIds = new JSONArray(deletedIdsJson);
            JSONArray deletedTitleBody = new JSONArray(deletedTitleBodyJson);

            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject notif = jsonArray.getJSONObject(i);
                String id = notif.optString("id", "");
                String notifTitle = notif.optString("title", "");
                String notifBody = notif.optString("body", "");

                boolean match = false;

                if (notificationId != null && notificationId.equals(id)) {
                    match = true;
                    deletedIds.put(id);
                } else if (title != null && body != null
                        && title.equals(notifTitle)
                        && body.equals(notifBody)) {
                    match = true;
                    JSONObject tb = new JSONObject();
                    tb.put("title", title);
                    tb.put("body", body);
                    deletedTitleBody.put(tb);
                }

                if (!match) {
                    updatedArray.put(notif);
                }
            }

            prefs.edit()
                    .putString(KEY_NOTIFICATIONS, updatedArray.toString())
                    .putString(KEY_DELETED_IDS, deletedIds.toString())
                    .putString(KEY_DELETED_TITLE_BODY, deletedTitleBody.toString())
                    .apply();

            call.resolve();

        } catch (JSONException e) {
            Log.e(TAG, "Error deleting notification", e);
            call.reject("Error deleting notification");
        }
    }

    /**
     * Optional: clear all saved notifications (used when you want to flush native store)
     */
    @PluginMethod
    public void clearSavedNotifications(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs =
                context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        prefs.edit()
                .putString(KEY_NOTIFICATIONS, "[]")
                .apply();

        Log.d(TAG, "Cleared saved notifications in SharedPreferences");
        call.resolve();
    }
}
