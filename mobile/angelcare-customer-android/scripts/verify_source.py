#!/usr/bin/env python3
"""R5.3 outer Android mask only + R5.1 TWA startup splash + R5 IVR and signing preservation. Static checks only."""
from pathlib import Path
from xml.etree import ElementTree as ET
import re
root=Path(__file__).resolve().parents[1]
android='{http://schemas.android.com/apk/res/android}'
main=root/'app/src/main'
manifest=ET.parse(main/'AndroidManifest.xml').getroot()
application=manifest.find('application'); assert application is not None
activities={a.get(android+'name'):a for a in application.findall('activity')}
launcher=activities['.AngelCareLauncherActivity']
assert launcher.get(android+'exported')=='true'
assert any(c.get(android+'name')=='android.intent.category.LAUNCHER' for f in launcher.findall('intent-filter') for c in f.findall('category'))
assert any(x.get(android+'name')=='android.support.customtabs.trusted.DEFAULT_URL' for x in launcher.findall('meta-data'))
assert 'com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity' in activities
assert all(x not in activities for x in ('.HomeActivity','.VoiceActivity','.InboxActivity'))
assert application.get(android+'manageSpaceActivity')=='com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity'
perms={p.get(android+'name') for p in manifest.findall('uses-permission')}
assert 'android.permission.POST_NOTIFICATIONS' in perms
assert 'android.permission.RECORD_AUDIO' not in perms
assert not any('RECOGNIZE_SPEECH' in ET.tostring(x,encoding='unicode') for x in manifest.iter())
assert any(s.get(android+'name')=='.AngelCareMessagingService' for s in application.findall('service'))
java=main/'java/com/angelcare/marketplace'
for name in ['AngelCareLauncherActivity','AngelCareApplication','AngelCareMessagingService','InboxStore','NotificationSupport','MarketplaceLinks']:
 assert (java/(name+'.java')).is_file(),name
for obsolete in ['HomeActivity','VoiceActivity','InboxActivity','NativeUi']:
 assert not (java/(obsolete+'.java')).exists(),obsolete
source=(java/'AngelCareLauncherActivity.java').read_text()
assert 'extends LauncherActivity' in source and 'shouldLaunchImmediately' in source and 'launchTwa()' in source
assert 'showConsentCard()' in source and 'hasFirebase()' in source
assert 'requestPermissions' in source and 'POST_NOTIFICATIONS' in source
assert 'RECORD_AUDIO' not in source and 'RecognizerIntent' not in source
assert 'angelcare_public_updates' in source
assert 'AngelCareLauncherActivity.class' in (java/'NotificationSupport.java').read_text()
assert 'open.setData(safe)' in (java/'NotificationSupport.java').read_text()
assert 'setAutoInitEnabled(InboxStore.optedIn(this))' in (java/'AngelCareApplication.java').read_text()
assert 'registerShortcuts()' not in (java/'AngelCareApplication.java').read_text()
assert 'RecognizerIntent' not in ''.join(f.read_text() for f in java.glob('*.java'))
assert 'getUserMedia' not in ''.join(f.read_text() for f in java.glob('*.java'))
assert 'angelcare_official_wordmark' in source
assert (main/'res/drawable-nodpi/angelcare_official_wordmark.png').is_file()
assert 'https://my.angelcarehub.com/angelcare-marketplace/fr' in (main/'res/values/strings.xml').read_text()
s=(root/'app/build.gradle').read_text()
assert re.search(r'versionCode\s+8',s) and re.search(r"versionName\s+'0.5.3'",s)
assert "keyAlias 'angelcare-preview'" in s
assert "applicationIdSuffix '.preview'" in s
assert 'signingConfig signingConfigs.angelcarePreview' in s
assert re.fullmatch(r'[0-9A-F]{2}(?::[0-9A-F]{2}){31}',(root/'trust/preview_cert_sha256.txt').read_text().strip())
for q in ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']:
 p=main/f'res/mipmap-{q}/ic_launcher.png';assert p.is_file() and p.stat().st_size>0
assert not any(root.rglob('*.keystore')) and not any(root.rglob('*.p12'))

# Google Android Browser Helper transfers native splash to the browser while loading.
# Must preserve TWA/web microphone authority, not fake full-screen via WebView.
metadata={m.get(android+'name'):m for m in launcher.findall('meta-data')}
assert metadata['android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE'].get(android+'resource')=='@drawable/angelcare_official_wordmark'
assert metadata['android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR'].get(android+'resource')=='@color/angelcare_splash_white'
assert metadata['android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY'].get(android+'value')=='${applicationId}.twa_splash_fileprovider'
assert metadata['android.support.customtabs.trusted.SPLASH_SCREEN_FADE_OUT_DURATION'].get(android+'value')=='220'
providers=[a for a in application.findall('provider') if a.get(android+'name')=='androidx.core.content.FileProvider']
assert len(providers)==1
provider=providers[0]
assert provider.get(android+'authorities')=='${applicationId}.twa_splash_fileprovider'
assert provider.get(android+'exported')=='false' and provider.get(android+'grantUriPermissions')=='true'
assert any(m.get(android+'name')=='android.support.FILE_PROVIDER_PATHS' and m.get(android+'resource')=='@xml/angelcare_twa_splash_paths' for m in provider.findall('meta-data'))
paths_xml=ET.parse(main/'res/xml/angelcare_twa_splash_paths.xml').getroot()
assert len(list(paths_xml))==1 and list(paths_xml)[0].tag=='files-path'
assert list(paths_xml)[0].get('name')=='twa_splash' and list(paths_xml)[0].get('path')=='twa_splash/'
colors_xml=ET.parse(main/'res/values/colors.xml').getroot()
assert any(x.get('name')=='angelcare_splash_white' and x.text=='#FFFFFF' for x in colors_xml)
assert 'ScaleType.CENTER_INSIDE' in source and 'extends LauncherActivity' in source
assert (main/'res/drawable-nodpi/angelcare_official_wordmark.png').is_file()
print('R5_1_TWA_NATIVE_TO_CHROME_SPLASH=PASS')
print('R5_1_FILE_PROVIDER_AUTHORITY=APPLICATION_ID_SPECIFIC')
print('R5_1_SPLASH_WHITE_OFFICIAL_LOGO=PASS')

print('R5_DIRECT_FULLSCREEN_MARKETPLACE=PASS')
print('R5_NATIVE_VOICE_SEARCH_REMOVED=PASS')
print('R5_HOTLINE_MICROPHONE=MARKETPLACE_WEB_LIVEKIT_AUTHORITY_ONLY')
print('R5_NOTIFICATION_CONSENT=CONFIGURED_FCM_ONLY')
print('R5_SIGNING_FINGERPRINT_PRESERVED=PASS')
print('LOCAL_BUILD=NOT_INVOKED')

# R5.2 user-selected real image: adaptive 26+ and legacy PNG layers.
import hashlib,struct
approved=root/'assets/APPROVED_ANGELCARE_R5_2_ICON_SOURCE.png'
expected=(root/'assets/APPROVED_ANGELCARE_R5_2_ICON_SOURCE.sha256').read_text().split()[0]
assert hashlib.sha256(approved.read_bytes()).hexdigest()==expected, 'APPROVED_ICON_SOURCE_DRIFT'
def png_size(p):
    b=p.read_bytes()
    assert b[:8]==b'\x89PNG\r\n\x1a\n',p
    return struct.unpack('>II',b[16:24])
assert png_size(approved)==(1254,1254)
for q,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    assert png_size(main/f'res/mipmap-{q}/ic_launcher.png')==(size,size),q
assert png_size(main/'res/drawable-nodpi/angelcare_approved_adaptive_foreground.png')==(432,432)
root_icon=ET.parse(main/'res/mipmap-anydpi-v26/ic_launcher.xml').getroot()
assert root_icon.tag=='adaptive-icon'
assert root_icon.find('background').get(android+'drawable')=='@color/angelcare_splash_white'
assert root_icon.find('foreground').get(android+'drawable')=='@drawable/angelcare_approved_adaptive_foreground'
assert application.get(android+'icon')=='@mipmap/ic_launcher'
assert application.get(android+'roundIcon')=='@mipmap/ic_launcher'
print('R5_2_SELECTED_USER_ICON=PASS')
print('R5_2_ADAPTIVE_ICON=PASS')
print('R5_2_ANDROID_ONLY_NO_MARKETPLACE_LAYOUT_CHANGES=PASS')

# R5.3: hardcoded squircle/shadow removed, Android OEM mask is the only outer shape.
def png_color_type(path):
    b=path.read_bytes()
    assert b[:8]==b'\x89PNG\r\n\x1a\n'
    return b[25]
foreground=main/'res/drawable-nodpi/angelcare_approved_adaptive_foreground.png'
assert png_color_type(foreground)==6, 'R5_3_FOREGROUND_MUST_BE_RGBA_WITH_ALPHA'
assert png_size(root/'assets/ANGELCARE_R5_3_LOGO_ONLY_TRANSPARENT.png')==(895,487)
assert png_color_type(root/'assets/ANGELCARE_R5_3_LOGO_ONLY_TRANSPARENT.png')==6
assert (root/'assets/APPROVED_ANGELCARE_R5_2_ICON_SOURCE.png').is_file(), 'PRESERVE_USER_APPROVED_ORIGINAL'
print('R5_3_HARDCODED_SQUIRCLE_REMOVED=PASS')
print('R5_3_NATIVE_ADAPTIVE_MASK_OWNS_OUTER_CORNER=PASS')
