#!/usr/bin/env python3
"""R5 Android-only direct TWA / existing IVR preservation / no native voice-search source gate."""
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
assert re.search(r'versionCode\s+5',s) and re.search(r"versionName\s+'0.5.0'",s)
assert "keyAlias 'angelcare-preview'" in s
assert "applicationIdSuffix '.preview'" in s
assert 'signingConfig signingConfigs.angelcarePreview' in s
assert re.fullmatch(r'[0-9A-F]{2}(?::[0-9A-F]{2}){31}',(root/'trust/preview_cert_sha256.txt').read_text().strip())
for q in ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']:
 p=main/f'res/mipmap-{q}/ic_launcher.png';assert p.is_file() and p.stat().st_size>0
assert not any(root.rglob('*.keystore')) and not any(root.rglob('*.p12'))
print('R5_DIRECT_FULLSCREEN_MARKETPLACE=PASS')
print('R5_NATIVE_VOICE_SEARCH_REMOVED=PASS')
print('R5_HOTLINE_MICROPHONE=MARKETPLACE_WEB_LIVEKIT_AUTHORITY_ONLY')
print('R5_NOTIFICATION_CONSENT=CONFIGURED_FCM_ONLY')
print('R5_SIGNING_FINGERPRINT_PRESERVED=PASS')
print('LOCAL_BUILD=NOT_INVOKED')
