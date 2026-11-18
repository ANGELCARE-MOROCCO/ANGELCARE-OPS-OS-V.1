package com.angelcare.marketplace;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** Device-local, bounded general-announcement inbox; NO private account/child data. */
public final class InboxStore {
    static final String PREFERENCES="angelcare_native_r4";
    private InboxStore() {}
    private static SharedPreferences prefs(Context ctx){return ctx.getSharedPreferences(PREFERENCES,Context.MODE_PRIVATE);}
    public static synchronized void add(Context ctx,String title,String body,String url,String kind) {
        try {
            JSONArray old=new JSONArray(prefs(ctx).getString("inbox","[]"));
            JSONObject item=new JSONObject();
            item.put("title",title.substring(0,Math.min(title.length(),100)));
            item.put("body",body.substring(0,Math.min(body.length(),240)));
            item.put("url",MarketplaceLinks.verified(url).toString());
            item.put("kind",kind);item.put("when",System.currentTimeMillis());
            JSONArray next=new JSONArray();next.put(item);
            for(int i=0;i<Math.min(old.length(),79);i++)next.put(old.get(i));
            prefs(ctx).edit().putString("inbox",next.toString()).apply();
        } catch(Exception ignored) { }
    }
    public static synchronized List<JSONObject> all(Context ctx){
        List<JSONObject> out=new ArrayList<>();
        try {JSONArray data=new JSONArray(prefs(ctx).getString("inbox","[]"));
            for(int i=0;i<data.length();i++)out.add(data.getJSONObject(i));}
        catch(Exception ignored) {}return out;
    }
    public static void clear(Context ctx){prefs(ctx).edit().remove("inbox").apply();}
    public static boolean optedIn(Context ctx){return prefs(ctx).getBoolean("push_optin",false);}
    public static void setOptIn(Context ctx,boolean enabled){prefs(ctx).edit().putBoolean("push_optin",enabled).apply();}
}
