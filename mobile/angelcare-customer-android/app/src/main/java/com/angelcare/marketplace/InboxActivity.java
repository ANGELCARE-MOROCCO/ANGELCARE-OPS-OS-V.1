package com.angelcare.marketplace;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.LinearLayout;
import org.json.JSONObject;
import java.text.DateFormat;
import java.util.Date;
import java.util.List;

/** Inbox is general-public opt-in messages only; no fake booking statuses. */
public final class InboxActivity extends Activity {
    @Override public void onCreate(Bundle state){super.onCreate(state);render();}
    private void render(){
        LinearLayout root=NativeUi.page(this);
        NativeUi.add(root,NativeUi.eyebrow(this,"ANGELCARE NOTIFICATIONS"),12);
        NativeUi.add(root,NativeUi.text(this,"Votre boîte de réception",26,NativeUi.CREAM,true),11);
        NativeUi.add(root,NativeUi.text(this,"Annonces et activités reçues par cet appareil. Rien ici ne prétend être une réservation ou un message privé.",13,NativeUi.SECONDARY,false),10);
        List<JSONObject> entries=InboxStore.all(this);
        if(entries.isEmpty()){
            LinearLayout empty=NativeUi.panel(this);
            NativeUi.add(empty,NativeUi.eyebrow(this,"AUCUNE NOTIFICATION"),0);
            NativeUi.add(empty,NativeUi.text(this,"Vos nouvelles annonces AngelCare apparaîtront ici après activation des alertes et réception effective d'un message.",14,NativeUi.CREAM,false),10);
            NativeUi.add(root,empty,23);
        }
        for(JSONObject item:entries){
            String title=item.optString("title","AngelCare"),body=item.optString("body","");
            String url=item.optString("url",MarketplaceLinks.ROOT);
            String formatted=DateFormat.getDateTimeInstance(DateFormat.MEDIUM,DateFormat.SHORT).format(new Date(item.optLong("when",System.currentTimeMillis())));
            LinearLayout panel=NativeUi.panel(this);
            NativeUi.add(panel,NativeUi.eyebrow(this,item.optString("kind","UPDATE").toUpperCase(java.util.Locale.ROOT)+"  ·  "+formatted),0);
            NativeUi.add(panel,NativeUi.text(this,title,17,NativeUi.CREAM,true),7);
            NativeUi.add(panel,NativeUi.text(this,body,14,NativeUi.SECONDARY,false),5);
            NativeUi.add(panel,NativeUi.action(this,"Voir dans AngelCare  →",false,()->MarketplaceLinks.open(this,MarketplaceLinks.verified(url))),8);
            NativeUi.add(root,panel,13);
        }
        if(!entries.isEmpty()) NativeUi.add(root,NativeUi.action(this,"Effacer les notifications de cet appareil",false,
            ()->new android.app.AlertDialog.Builder(this).setTitle("Effacer l'historique local ?")
                .setMessage("Les notifications enregistrées sur ce téléphone seront supprimées.")
                .setNegativeButton("Annuler",null)
                .setPositiveButton("Effacer",(d,w)->{InboxStore.clear(this);render();}).show()),24);
        NativeUi.add(root,NativeUi.action(this,"← Retour",false,this::finish),17);
    }
}
