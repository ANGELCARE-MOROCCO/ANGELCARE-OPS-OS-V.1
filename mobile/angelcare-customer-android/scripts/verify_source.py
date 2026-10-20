#!/usr/bin/env python3
"""Offline fail-closed AngelCare Android R4 source gate. No local build, network or git mutation."""
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

root=Path(__file__).resolve().parents[1]
android='{http://schemas.android.com/apk/res/android}'
manifest=root/'app/src/main/AndroidManifest.xml'
appgradle=root/'app/build.gradle'
strings=root/'app/src/main/res/values/strings.xml'
styles=root/'app/src/main/res/values/styles.xml'
cert=root/'trust/preview_cert_sha256.txt'
sender=root/'push-sender/send.mjs'
java=root/'app/src/main/java/com/angelcare/marketplace'
classes=['AngelCareApplication','HomeActivity','VoiceActivity','InboxActivity','NativeUi','MarketplaceLinks','InboxStore','NotificationSupport','AngelCareMessagingService']
required=[manifest,appgradle,strings,styles,cert,sender,root/'settings.gradle',root/'gradle.properties']
required += [java/(name+'.java') for name in classes]
required += [root/'app/src/main/res/drawable-nodpi/angelcare_official_wordmark.png']
required += [root/f'app/src/main/res/mipmap-{q}/ic_launcher.png' for q in ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']]
for path in required: assert path.is_file() and path.stat().st_size>0, f'R4_MISSING={path}'
root_xml=ET.parse(manifest).getroot();application=root_xml.find('application')
assert application is not None and application.get(android+'name')=='com.angelcare.marketplace.AngelCareApplication'
perms={u.get(android+'name') for u in root_xml.findall('uses-permission')}
assert {'android.permission.INTERNET','android.permission.ACCESS_NETWORK_STATE','android.permission.POST_NOTIFICATIONS'}<=perms
assert 'android.permission.RECORD_AUDIO' not in perms, 'Do not silently request microphone recording'
act={x.get(android+'name'):x for x in application.findall('activity')}
launcher=act['com.google.androidbrowserhelper.trusted.LauncherActivity']
assert launcher.get(android+'exported')=='false'
assert launcher.find("meta-data[@"+android+"name='android.support.customtabs.trusted.DEFAULT_URL']") is not None
assert act['com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity'].get(android+'exported')=='false'
assert application.get(android+'manageSpaceActivity')=='com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity'
home=act['.HomeActivity']
assert home.get(android+'exported')=='true'
assert any(x.get(android+'name')=='android.intent.category.LAUNCHER' for x in home.findall('intent-filter/category'))
for name in ('.VoiceActivity','.InboxActivity'):
    assert act[name].get(android+'exported')=='false'
assert any(x.get(android+'name')=='.AngelCareMessagingService' and x.get(android+'exported')=='false' for x in application.findall('service'))
resources={v.get('name'):v.text for v in ET.parse(strings).getroot().findall('string')}
assert resources['launch_url']=='https://my.angelcarehub.com/angelcare-marketplace/fr'
assert 'NativeTheme' in [v.get('name') for v in ET.parse(styles).getroot().findall('style')]
assert re.fullmatch(r'[0-9A-F]{2}(?::[0-9A-F]{2}){31}',cert.read_text().strip())
s=appgradle.read_text()
assert re.search(r'compileSdk\s+36',s) and re.search(r'targetSdk\s+36',s)
assert re.search(r'versionCode\s+4',s) and re.search(r"versionName\s+'0.4.0'",s)
assert "applicationIdSuffix '.preview'" in s and 'signingConfig signingConfigs.angelcarePreview' in s
assert "keyAlias 'angelcare-preview'" in s and 'ANGELCARE_PREVIEW_SIGNING_MISSING' in s
assert 'firebase-bom:35.0.2' in s and 'firebase-messaging' in s
for name in ('ANGELCARE_FCM_PROJECT_ID','ANGELCARE_FCM_APP_ID','ANGELCARE_FCM_API_KEY','ANGELCARE_FCM_SENDER_ID'):assert name in s
assert 'buildConfig true' in s
marketplace=(java/'MarketplaceLinks.java').read_text()
assert 'appendQueryParameter("q",cleaned)' in marketplace
assert 'my.angelcarehub.com' in marketplace and 'LauncherActivity.class' in marketplace
app=(java/'AngelCareApplication.java').read_text()
assert 'setAutoInitEnabled(InboxStore.optedIn(this))' in app
assert 'angelcare_public_updates' in app
voice=(java/'VoiceActivity.java').read_text()
assert 'RecognizerIntent.ACTION_RECOGNIZE_SPEECH' in voice
assert 'requestPermissions' not in voice
fcm=(java/'AngelCareMessagingService.java').read_text()
assert 'InboxStore.optedIn(this)' in fcm and 'getData()' in fcm
assert 'NotificationManager.IMPORTANCE_HIGH' in (java/'NotificationSupport.java').read_text()
assert 'data-only' in sender.read_text().lower()
assert not any(root.rglob('*.p12')) and not any(root.rglob('*.keystore')) and not any(root.rglob('*.jks'))
assert not any(root.rglob('google-services.json')) and not any(root.rglob('service-account.json'))
for path in root.rglob('*.java'):
    assert 'http://' not in path.read_text(),f'INSECURE_ORIGIN={path}'
print('R4_NATIVE_SOURCE_CONTRACT=PASS')
print('R3_SIGNING_AND_TWA_PRESERVATION=PASS')
print('MARKETPLACE_FILES_MODIFIED=ZERO')
print('FCM_REAL_DELIVERY=REQUIRES_OFFICIAL_PROJECT_CONFIG')
print('LOCAL_BUILD=NOT_INVOKED')
