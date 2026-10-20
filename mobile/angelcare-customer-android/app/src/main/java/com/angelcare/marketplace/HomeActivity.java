package com.angelcare.marketplace;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import com.google.firebase.messaging.FirebaseMessaging;

/** Premium native companion; a single button opens the SAME verified fullscreen TWA. */
public final class HomeActivity extends Activity {
    private static final int NOTIFICATION_REQUEST=1404;
    private TextView networkState,pushState;
    @Override public void onCreate(Bundle state){super.onCreate(state);render();}
    @Override protected void onResume(){super.onResume();status();}
    private boolean online(){
        ConnectivityManager c=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo network=c!=null?c.getActiveNetworkInfo():null;
        return network!=null && network.isConnected();
    }
    private void open(String target){
        if(!online()){new android.app.AlertDialog.Builder(this).setTitle("Connexion indisponible")
            .setMessage("Le Marketplace utilise votre connexion internet. Reconnectez-vous puis réessayez.")
            .setPositiveButton("Réessayer",(dialog,which)->{if(online())MarketplaceLinks.open(this,MarketplaceLinks.verified(target));else status();})
            .setNegativeButton("Plus tard",null).show();return;}
        MarketplaceLinks.open(this,MarketplaceLinks.verified(target));
    }
    private void render(){
        LinearLayout root=NativeUi.page(this);
        ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.angelcare_official_wordmark);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);logo.setAdjustViewBounds(true);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,NativeUi.dp(this,122));
        root.addView(logo,lp);
        NativeUi.add(root,NativeUi.eyebrow(this,"ANGELCARE  •  PREMIUM FAMILY EXPERIENCE"),8);
        NativeUi.add(root,NativeUi.text(this,"Votre univers famille, à portée de main.",27,NativeUi.CREAM,true),11);
        NativeUi.add(root,NativeUi.text(this,"Un accès direct au Marketplace, avec des services natifs conçus pour votre quotidien.",14,NativeUi.SECONDARY,false),9);
        NativeUi.add(root,NativeUi.action(this,"Ouvrir le Marketplace  →",true,()->open(MarketplaceLinks.ROOT)),24);
        NativeUi.add(root,NativeUi.action(this,"Recherche vocale  🎙",false,()->startActivity(new Intent(this,VoiceActivity.class))),12);
        NativeUi.add(root,NativeUi.action(this,"Mes notifications  ✉",false,()->startActivity(new Intent(this,InboxActivity.class))),10);
        LinearLayout notice=NativeUi.panel(this);
        NativeUi.add(notice,NativeUi.eyebrow(this,"NOTIFICATIONS ANGELCARE"),0);
        NativeUi.add(notice,NativeUi.text(this,"Choisissez de recevoir les nouveautés et activités publiques AngelCare. Aucun rattachement automatique à votre compte client.",13,NativeUi.SECONDARY,false),8);
        pushState=NativeUi.text(this,"",12,NativeUi.GOLD,true);
        NativeUi.add(notice,pushState,10);
        NativeUi.add(notice,NativeUi.action(this,"Activer / désactiver les alertes",false,this::togglePush),10);
        NativeUi.add(root,notice,17);
        NativeUi.add(root,NativeUi.action(this,"Tester une notification locale (DÉMO)",false,()->{
            String title="AngelCare — Test local";
            String body="Ceci est un test sur votre téléphone, pas une offre ni un message réel.";
            InboxStore.add(this,title,body,MarketplaceLinks.ROOT,"test_local");
            NotificationSupport.show(this,title,body,MarketplaceLinks.ROOT);
            Toast.makeText(this,"Test local enregistré dans votre boîte",Toast.LENGTH_LONG).show();
        }),10);
        networkState=NativeUi.text(this,"",12,NativeUi.SECONDARY,false);
        NativeUi.add(root,networkState,15);
        NativeUi.add(root,NativeUi.text(this,"🔒 Microphone utilisé seulement lorsque vous lancez une recherche vocale. Les alertes nécessitent votre accord. Vos données de compte restent dans le Marketplace.",12,NativeUi.SECONDARY,false),13);
        status();
    }
    private void status(){
        if(networkState!=null)networkState.setText(online()?"● Connexion active — Marketplace en ligne":"● Hors ligne — reconnexion nécessaire");
        if(pushState!=null){ boolean opt=InboxStore.optedIn(this);
            boolean ready=((AngelCareApplication)getApplication()).hasFirebase();
            pushState.setText(!ready?"FCM non configuré — activation disponible après connexion du projet Firebase":
                opt?"Alertes publiques activées — vous pouvez les désactiver ici":"Alertes publiques désactivées");
        }
    }
    private void togglePush(){
        AngelCareApplication app=(AngelCareApplication)getApplication();
        if(!app.hasFirebase()){
            new android.app.AlertDialog.Builder(this).setTitle("Notifications à venir")
                .setMessage("Le système Android est prêt. L'activation nécessite les paramètres du projet Firebase officiel d'AngelCare; aucune inscription fictive n'est créée.")
                .setPositiveButton("OK",null).show();return;
        }
        if(InboxStore.optedIn(this)){
            InboxStore.setOptIn(this,false);
            FirebaseMessaging.getInstance().unsubscribeFromTopic("angelcare_public_updates");
            FirebaseMessaging.getInstance().setAutoInitEnabled(false);
            status();return;
        }
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFICATION_REQUEST);return;
        }
        enableAlerts();
    }
    private void enableAlerts(){
        InboxStore.setOptIn(this,true);
        FirebaseMessaging.getInstance().setAutoInitEnabled(true);
        FirebaseMessaging.getInstance().subscribeToTopic("angelcare_public_updates")
            .addOnFailureListener(err->{InboxStore.setOptIn(this,false);Toast.makeText(this,"Inscription non confirmée. Réessayez avec Internet.",Toast.LENGTH_LONG).show();status();});
        status();
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==NOTIFICATION_REQUEST){
            if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)enableAlerts();
            else Toast.makeText(this,"Autorisation refusée. Les alertes restent désactivées.",Toast.LENGTH_LONG).show();
        }
    }
}
