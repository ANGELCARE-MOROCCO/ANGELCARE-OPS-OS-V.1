package com.angelcare.marketplace;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.net.Uri;

public final class NotificationSupport {
    private static final String CHANNEL="angelcare_updates";
    private NotificationSupport(){}
    public static void channels(Context c){
        if(Build.VERSION.SDK_INT>=26){
            NotificationManager nm=c.getSystemService(NotificationManager.class);
            NotificationChannel ch=new NotificationChannel(CHANNEL,c.getString(R.string.notifications_channel_name),NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription(c.getString(R.string.notifications_channel_description));
            ch.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            nm.createNotificationChannel(ch);
        }
    }
    public static void show(Context c,String title,String message,String uri){
        if(Build.VERSION.SDK_INT>=33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        channels(c);
        Uri safe=MarketplaceLinks.verified(uri);
        Intent open=new Intent(c,AngelCareLauncherActivity.class);
        open.setAction(Intent.ACTION_VIEW);
        open.setData(safe);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending=PendingIntent.getActivity(c,Math.abs((int)System.nanoTime()),open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,CHANNEL):new Notification.Builder(c);
        builder.setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(title).setContentText(message)
            .setStyle(new Notification.BigTextStyle().bigText(message))
            .setAutoCancel(true).setPriority(Notification.PRIORITY_HIGH).setContentIntent(pending).setVisibility(Notification.VISIBILITY_PRIVATE)
            .setCategory(Notification.CATEGORY_RECOMMENDATION);
        ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).notify((int)(System.currentTimeMillis()%Integer.MAX_VALUE),builder.build());
    }
}
