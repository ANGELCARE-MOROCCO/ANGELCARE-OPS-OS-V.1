package com.angelcare.marketplace;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** Native design is limited to this companion; Marketplace storefront is never rewritten. */
public final class NativeUi {
    static final int NAVY=Color.rgb(16,40,71), GOLD=Color.rgb(212,165,91), CREAM=Color.rgb(255,249,239);
    static final int SECONDARY=Color.rgb(202,217,235);
    private NativeUi() {}
    public static int dp(Context c,int px){ return Math.round(px*c.getResources().getDisplayMetrics().density); }
    public static LinearLayout page(Activity a) {
        ScrollView scroll = new ScrollView(a); scroll.setFillViewport(true);scroll.setBackgroundColor(NAVY);
        LinearLayout column = new LinearLayout(a);column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(dp(a,22),dp(a,20),dp(a,22),dp(a,26));
        scroll.addView(column,new ScrollView.LayoutParams(-1,-2));a.setContentView(scroll);
        return column;
    }
    public static TextView text(Context c,String value,float size,int color,boolean bold){
        TextView v=new TextView(c);v.setText(value);v.setTextSize(size);v.setTextColor(color);
        v.setTypeface(Typeface.DEFAULT,bold?Typeface.BOLD:Typeface.NORMAL);
        v.setLineSpacing(dp(c,2),1f);return v;
    }
    public static void add(LinearLayout l,View v,int marginTop){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.topMargin=dp(l.getContext(),marginTop);l.addView(v,p);
    }
    public static Button action(Context c,String label,boolean primary,Runnable act){
        Button b=new Button(c);b.setText(label);b.setAllCaps(false);b.setTextSize(15);
        b.setTextColor(primary?NAVY:CREAM);
        GradientDrawable bg=new GradientDrawable();bg.setColor(primary?GOLD:Color.rgb(28,59,91));
        bg.setCornerRadius(dp(c,15));bg.setStroke(dp(c,1),primary?GOLD:Color.rgb(77,101,126));
        b.setBackground(bg);b.setPadding(dp(c,14),dp(c,15),dp(c,14),dp(c,15));
        b.setMinimumHeight(dp(c,52));b.setOnClickListener(v->act.run());return b;
    }
    public static LinearLayout panel(Context c){
        LinearLayout p=new LinearLayout(c);p.setOrientation(LinearLayout.VERTICAL);p.setPadding(dp(c,18),dp(c,18),dp(c,18),dp(c,18));
        GradientDrawable bg=new GradientDrawable();bg.setColor(Color.rgb(26,57,90));bg.setCornerRadius(dp(c,19));
        bg.setStroke(dp(c,1),Color.rgb(57,84,110));p.setBackground(bg);return p;
    }
    public static TextView eyebrow(Context c,String s){return text(c,s,12,GOLD,true);}
}
