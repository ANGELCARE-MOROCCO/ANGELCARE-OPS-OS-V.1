package com.angelcare.marketplace;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/** Strictly same-origin AngelCare targets: no untrusted links in notifications or voice. */
public final class MarketplaceLinks {
    private MarketplaceLinks() {}
    public static final String ORIGIN = "https://my.angelcarehub.com";
    public static final String ROOT = ORIGIN + "/angelcare-marketplace/fr";
    public static final String SEARCH = ROOT + "/marketplace/search";
    public static final String FAMILIES = ROOT + "/families";

    public static Uri verified(String incoming) {
        if (incoming == null || incoming.length() > 2048) return Uri.parse(ROOT);
        try {
            Uri u = Uri.parse(incoming);
            if (!"https".equalsIgnoreCase(u.getScheme()) ||
                !"my.angelcarehub.com".equalsIgnoreCase(u.getHost()) ||
                u.getUserInfo() != null || (u.getPort() != -1 && u.getPort() != 443) ||
                u.getFragment() != null || u.isOpaque()) return Uri.parse(ROOT);
            String p = u.getEncodedPath();
            if (p == null || !(p.equals("/angelcare-marketplace") || p.startsWith("/angelcare-marketplace/")) ||
                p.toLowerCase(java.util.Locale.ROOT).contains("%2f") ||
                p.toLowerCase(java.util.Locale.ROOT).contains("%5c") ||
                p.contains("\\") || p.contains("..") || p.contains("//")) return Uri.parse(ROOT);
            return u;
        } catch (Exception ignored) { return Uri.parse(ROOT); }
    }
    public static Uri search(String text, String locale) {
        String lang = ("ar".equals(locale) || "en".equals(locale)) ? locale : "fr";
        String cleaned = text == null ? "" : text.trim();
        if (cleaned.length() > 180) cleaned = cleaned.substring(0,180);
        return Uri.parse(ORIGIN + "/angelcare-marketplace/" + lang + "/marketplace/search")
            .buildUpon().appendQueryParameter("q",cleaned).build();
    }
    public static void open(Activity host, Uri target) {
        Intent intent = new Intent(host, LauncherActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(verified(target.toString()));
        host.startActivity(intent);
    }
}
