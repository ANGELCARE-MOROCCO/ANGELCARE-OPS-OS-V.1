package com.angelcare.marketplace;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/** FCM data-only public broadcasts, opt-in; never assumes identity of Marketplace account. */
public final class AngelCareMessagingService extends FirebaseMessagingService {
    @Override public void onMessageReceived(RemoteMessage message){
        if(!InboxStore.optedIn(this))return;
        Map<String,String> d=message.getData();
        String kind=d.getOrDefault("kind","");
        if(!(kind.equals("announcement") || kind.equals("offer") || kind.equals("activity")))return;
        String title=d.getOrDefault("title", "AngelCare Marketplace").trim();
        String body=d.getOrDefault("body", "").trim();
        if(title.isEmpty() || body.isEmpty())return;
        if(title.length()>100)title=title.substring(0,100);
        if(body.length()>240)body=body.substring(0,240);
        String target=MarketplaceLinks.verified(d.get("url")).toString();
        InboxStore.add(this,title,body,target,kind);
        NotificationSupport.show(this,title,body,target);
    }
    @Override public void onNewToken(String token){
        // Never transmit token to Marketplace or associate it with a web account.
        if(InboxStore.optedIn(this) && ((AngelCareApplication)getApplication()).hasFirebase()){
            com.google.firebase.messaging.FirebaseMessaging.getInstance().subscribeToTopic("angelcare_public_updates");
        }
    }
}
