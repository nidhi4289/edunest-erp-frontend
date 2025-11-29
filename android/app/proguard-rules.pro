# --- Keep Capacitor core ---
-keep class com.getcapacitor.** { *; }

# Keep plugin annotations and permission callbacks
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
    @com.getcapacitor.annotation.PermissionCallback *;
}

# --- Keep official plugins you use ---
-keep class com.capacitorjs.plugins.pushnotifications.** { *; }
-keep class com.capacitorjs.plugins.localnotifications.** { *; }

# --- Keep your custom plugin ---
-keep class com.edunest.erp.NotificationBridge { *; }

# (Optionally) keep your FCM service
-keep class com.edunest.erp.EdunestFirebaseMessagingService { *; }
