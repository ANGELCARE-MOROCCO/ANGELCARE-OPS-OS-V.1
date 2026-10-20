package com.angelcare.marketplace;

import android.app.Application;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.Arrays;

/** Separate Android companion bootstrap. No Marketplace authentication or web modification. */
public final class AngelCareApplication extends Application {
    private static final String TAG="AngelCareR4";
    private boolean fcmReady=false;
    @Override public void onCreate(){
        super.onCreate(); NotificationSupport.channels(this); configureFirebase(); registerShortcuts();
    }
    public boolean hasFirebase(){return fcmReady;}
    private void configureFirebase(){
        if(BuildConfig.FCM_APP_ID.isEmpty() || BuildConfig.FCM_API_KEY.isEmpty() ||
            BuildConfig.FCM_SENDER_ID.isEmpty() || BuildConfig.FCM_PROJECT_ID.isEmpty()){
            Log.i(TAG,"FCM_NOT_CONFIGURED: native inbox / local notification demo remain available");return;
        }
        try {
            if(FirebaseApp.getApps(this).isEmpty()){
                FirebaseOptions opts=new FirebaseOptions.Builder()
                    .setApplicationId(BuildConfig.FCM_APP_ID)
                    .setApiKey(BuildConfig.FCM_API_KEY)
                    .setProjectId(BuildConfig.FCM_PROJECT_ID)
                    .setGcmSenderId(BuildConfig.FCM_SENDER_ID).build();
                FirebaseApp.initializeApp(this,opts);
            }
            fcmReady=true;
            FirebaseMessaging.getInstance().setAutoInitEnabled(InboxStore.optedIn(this));
            if(InboxStore.optedIn(this)){
                FirebaseMessaging.getInstance().subscribeToTopic("angelcare_public_updates");
            }
        }catch(Exception e){ Log.w(TAG,"FCM_INIT_FAILED: push unavailable, native app remains usable"); }
    }
    private void registerShortcuts(){
        if(Build.VERSION.SDK_INT<25)return;
        try{
            ShortcutManager sm=getSystemService(ShortcutManager.class);
            Intent voice=new Intent(this,VoiceActivity.class).setAction(Intent.ACTION_VIEW);
            Intent inbox=new Intent(this,InboxActivity.class).setAction(Intent.ACTION_VIEW);
            Intent home=new Intent(this,HomeActivity.class).setAction(Intent.ACTION_VIEW);
            sm.addDynamicShortcuts(Arrays.asList(
                new ShortcutInfo.Builder(this,"angelcare_voice").setShortLabel("Recherche vocale")
                    .setLongLabel("Recherche vocale AngelCare").setIcon(Icon.createWithResource(this,R.mipmap.ic_launcher)).setIntent(voice).build(),
                new ShortcutInfo.Builder(this,"angelcare_inbox").setShortLabel("Notifications")
                    .setLongLabel("Boîte de notifications AngelCare").setIcon(Icon.createWithResource(this,R.mipmap.ic_launcher)).setIntent(inbox).build(),
                new ShortcutInfo.Builder(this,"angelcare_home").setShortLabel("AngelCare")
                    .setLongLabel("Ouvrir AngelCare").setIcon(Icon.createWithResource(this,R.mipmap.ic_launcher)).setIntent(home).build()
            ));
        }catch(Exception e){ Log.w(TAG,"SHORTCUTS_UNAVAILABLE"); }
    }
}
