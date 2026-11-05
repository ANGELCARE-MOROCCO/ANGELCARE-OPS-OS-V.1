package com.angelcare.marketplace;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.google.androidbrowserhelper.trusted.LauncherActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.Locale;

/** Restores immediate verified fullscreen Marketplace. No native home or voice search.
 *  Optional once-only native notification-consent CARD is shown solely if real FCM is configured.
 *  Microphone for AngelCare Hotline remains entirely owned by the website's LiveKit session,
 *  after an eligible agent picks up; Chrome requests the site's permission at that moment.
 */
public final class AngelCareLauncherActivity extends LauncherActivity {
    // Browser Helper transfers our branded splash into the trusted Chrome session.
    // This retains the direct TWA launch. It does not introduce a native landing page.
    @Override protected android.widget.ImageView.ScaleType getSplashImageScaleType(){
        return android.widget.ImageView.ScaleType.CENTER_INSIDE;
    }
    private static final String PREFS="angelcare_r5_notification_consent";
    private static final int PUSH_PERMISSION=1505;
    private boolean launched=false;

    private boolean needsOffer(){
        return ((AngelCareApplication)getApplication()).hasFirebase()
            && !InboxStore.optedIn(this)
            && !getSharedPreferences(PREFS,Context.MODE_PRIVATE).getBoolean("offer_completed",false);
    }
    @Override protected boolean shouldLaunchImmediately(){return !needsOffer();}
    @Override protected void onCreate(Bundle state){
        // Super handles the authenticated TWA session and may finish on task restoration.
        boolean offer=needsOffer();
        super.onCreate(state);
        if(offer && !isFinishing()) showConsentCard();
    }
    private int dp(int x){return (int)(x*getResources().getDisplayMetrics().density+0.5f);}
    private GradientDrawable bg(int color,int radius){
        GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(radius));return g;
    }
    private TextView text(String value,int size,int color,boolean bold){
        TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);
        if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;
    }
    private String[] copy(){
        String lang=Locale.getDefault().getLanguage();
        if("ar".equals(lang))return new String[]{"إشعارات AngelCare","هل ترغب في تلقي أخبار الأنشطة والعروض المنشورة؟ يمكنك الرفض أو إيقاف الإشعارات لاحقًا.","تفعيل الإشعارات","ليس الآن"};
        if("en".equals(lang))return new String[]{"AngelCare notifications","Would you like updates about published activities and offers? Optional, and you can turn notifications off later.","Enable notifications","Not now"};
        return new String[]{"Notifications AngelCare","Souhaitez-vous recevoir les actualités, activités et offres publiées ? C’est facultatif et désactivable à tout moment.","Activer les alertes","Plus tard"};
    }
    private void showConsentCard(){
        String[] c=copy();
        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);
        card.setPadding(dp(22),dp(20),dp(22),dp(18));
        card.setBackground(bg(Color.WHITE,25));
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.angelcare_official_wordmark);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        card.addView(logo,new LinearLayout.LayoutParams(-1,dp(80)));
        TextView title=text(c[0],23,Color.rgb(16,40,71),true);title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams=new LinearLayout.LayoutParams(-1,-2);titleParams.topMargin=dp(7);card.addView(title,titleParams);
        TextView detail=text(c[1],14,Color.rgb(82,97,116),false);detail.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams descParams=new LinearLayout.LayoutParams(-1,-2);descParams.topMargin=dp(12);card.addView(detail,descParams);
        Button yes=new Button(this);yes.setAllCaps(false);yes.setText(c[2]);yes.setTextColor(Color.WHITE);
        yes.setBackground(bg(Color.rgb(16,40,71),16));
        LinearLayout.LayoutParams yesParams=new LinearLayout.LayoutParams(-1,dp(52));yesParams.topMargin=dp(23);card.addView(yes,yesParams);
        Button later=new Button(this);later.setAllCaps(false);later.setText(c[3]);later.setTextColor(Color.rgb(16,40,71));
        later.setBackground(bg(Color.rgb(241,245,248),16));
        LinearLayout.LayoutParams laterParams=new LinearLayout.LayoutParams(-1,dp(48));laterParams.topMargin=dp(10);card.addView(later,laterParams);
        AlertDialog dialog=new AlertDialog.Builder(this).setView(card).create();
        dialog.setCancelable(false);
        yes.setOnClickListener(v->{
            markOfferCompleted();dialog.dismiss();
            if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},PUSH_PERMISSION);
            }else{subscribePublicUpdates();continueToMarketplace();}
        });
        later.setOnClickListener(v->{markOfferCompleted();InboxStore.setOptIn(this,false);dialog.dismiss();continueToMarketplace();});
        dialog.show();
        Window window=dialog.getWindow();if(window!=null){
            window.setBackgroundDrawableResource(android.R.color.transparent);
            window.setLayout(Math.min(getResources().getDisplayMetrics().widthPixels-dp(32),dp(420)),WindowManager.LayoutParams.WRAP_CONTENT);
        }
    }
    private void markOfferCompleted(){getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putBoolean("offer_completed",true).apply();}
    private void subscribePublicUpdates(){
        if(!((AngelCareApplication)getApplication()).hasFirebase())return;
        InboxStore.setOptIn(this,true);
        FirebaseMessaging.getInstance().setAutoInitEnabled(true);
        FirebaseMessaging.getInstance().subscribeToTopic("angelcare_public_updates")
            .addOnFailureListener(err->{InboxStore.setOptIn(this,false);FirebaseMessaging.getInstance().setAutoInitEnabled(false);});
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] grantResults){
        super.onRequestPermissionsResult(requestCode,permissions,grantResults);
        if(requestCode==PUSH_PERMISSION){
            if(grantResults.length>0&&grantResults[0]==PackageManager.PERMISSION_GRANTED)subscribePublicUpdates();
            else InboxStore.setOptIn(this,false);
            continueToMarketplace();
        }
    }
    private void continueToMarketplace(){if(!launched && !isFinishing()){launched=true;launchTwa();}}
}
