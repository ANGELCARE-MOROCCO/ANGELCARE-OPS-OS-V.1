package com.angelcare.marketplace;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.text.InputFilter;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.graphics.Color;
import java.util.ArrayList;
import java.util.Locale;

/** The speech provider handles capture; AngelCare does NOT record, store or upload audio. */
public final class VoiceActivity extends Activity {
    private static final int RECOGNIZE=412;
    private String language="fr";
    private EditText query;
    private TextView status;
    @Override public void onCreate(Bundle state){super.onCreate(state);render();}
    private void render(){
        LinearLayout root=NativeUi.page(this);
        NativeUi.add(root,NativeUi.eyebrow(this,"ANGELCARE VOICE NAVIGATOR"),10);
        NativeUi.add(root,NativeUi.text(this,"Dites-nous ce que vous recherchez.",27,NativeUi.CREAM,true),12);
        NativeUi.add(root,NativeUi.text(this,"Garde à domicile, activités pour enfants, produits, services… Votre demande ouvre la recherche officielle AngelCare.",14,NativeUi.SECONDARY,false),12);
        NativeUi.add(root,NativeUi.text(this,"LANGUE DE RECHERCHE",12,NativeUi.GOLD,true),25);
        LinearLayout options=new LinearLayout(this);options.setOrientation(LinearLayout.HORIZONTAL);
        for(String code:new String[]{"fr","ar","en"}){
            String display=code.equals("fr")?"FR Français":code.equals("ar")?"AR العربية":"EN English";
            Button choice=new Button(this);choice.setText(display);choice.setTextSize(11);choice.setAllCaps(false);
            choice.setOnClickListener(v->{language=code;status.setText("Langue sélectionnée : "+display);});
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,NativeUi.dp(this,52),1);options.addView(choice,p);
        }
        NativeUi.add(root,options,9);
        query=new EditText(this);query.setSingleLine(false);query.setMinLines(2);
        query.setTextColor(Color.BLACK);query.setHintTextColor(Color.DKGRAY);
        query.setBackgroundColor(NativeUi.CREAM);query.setHint("Ex. garde d'enfant à domicile Casablanca");
        query.setPadding(NativeUi.dp(this,15),NativeUi.dp(this,13),NativeUi.dp(this,15),NativeUi.dp(this,13));
        query.setFilters(new InputFilter[]{new InputFilter.LengthFilter(180)});
        NativeUi.add(root,query,21);
        NativeUi.add(root,NativeUi.action(this,"🎙  Parler maintenant",true,this::recognize),15);
        NativeUi.add(root,NativeUi.action(this,"Rechercher dans AngelCare  →",false,this::submit),12);
        status=NativeUi.text(this,"Microphone inactif. Vous contrôlez quand l'écoute commence.",13,NativeUi.SECONDARY,false);
        NativeUi.add(root,status,16);
        NativeUi.add(root,NativeUi.text(this,"Confidentialité : l'outil de reconnaissance vocale installé sur votre appareil peut traiter l'audio selon ses propres règles. AngelCare ne conserve aucun enregistrement. Vous pouvez aussi taper votre demande.",12,NativeUi.SECONDARY,false),16);
        NativeUi.add(root,NativeUi.action(this,"← Retour aux commandes",false,this::finish),22);
    }
    private void recognize(){
        Intent i=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_PROMPT,"Parlez de votre besoin AngelCare");
        String locale=language.equals("ar")?"ar-MA":language.equals("en")?"en-US":"fr-FR";
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE,locale);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE,locale);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,3);
        try {startActivityForResult(i,RECOGNIZE);status.setText("Reconnaissance vocale ouverte…");}
        catch(ActivityNotFoundException e){status.setText("Reconnaissance vocale indisponible sur cet appareil. Tapez votre recherche ci-dessus.");}
        catch(Exception e){status.setText("Le micro n'a pas pu s'ouvrir. Vous pouvez saisir votre demande.");}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=RECOGNIZE)return;
        if(result==RESULT_OK&&data!=null){
            ArrayList<String> matches=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if(matches!=null&&!matches.isEmpty()&&matches.get(0)!=null){
                query.setText(matches.get(0));query.setSelection(query.length());
                status.setText("Texte reconnu. Vérifiez puis appuyez sur Rechercher.");return;
            }
        }
        status.setText("Aucune transcription confirmée. Réessayez ou tapez votre demande.");
    }
    private void submit(){
        String text=query.getText().toString().trim();
        if(text.isEmpty()){status.setText("Saisissez ou dictez d'abord votre recherche.");return;}
        MarketplaceLinks.open(this,MarketplaceLinks.search(text,language));
    }
}
