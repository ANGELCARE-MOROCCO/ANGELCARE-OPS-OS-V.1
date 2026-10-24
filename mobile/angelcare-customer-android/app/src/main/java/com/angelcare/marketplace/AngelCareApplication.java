package com.angelcare.marketplace;

import android.app.Application;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

/** Android push bootstrap only. The published Marketplace and hotline own web interactions. */
public final class AngelCareApplication extends Application {
    private static final String TAG="AngelCareR5";
    private boolean fcmReady=false;

    @Override public void onCreate(){
        super.onCreate();
        NotificationSupport.channels(this);
        configureFirebase();
    }
    public boolean hasFirebase(){return fcmReady;}
    private void configureFirebase(){
        if(BuildConfig.FCM_APP_ID.isEmpty() || BuildConfig.FCM_API_KEY.isEmpty() ||
            BuildConfig.FCM_SENDER_ID.isEmpty() || BuildConfig.FCM_PROJECT_ID.isEmpty()){
            Log.i(TAG,"FCM_NOT_CONFIGURED: no notification consent popup or subscription");return;
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
            if(InboxStore.optedIn(this)) FirebaseMessaging.getInstance().subscribeToTopic("angelcare_public_updates");
        }catch(Exception e){Log.w(TAG,"FCM_INIT_FAILED: web app and IVR remain unaffected");}
    }
}
