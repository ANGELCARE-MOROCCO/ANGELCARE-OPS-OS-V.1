#!/usr/bin/env python3
"""Offline AngelCare TWA source gate, including stable signing / trust R3."""
from pathlib import Path
from xml.etree import ElementTree as ET
import re
root=Path(__file__).resolve().parents[1]
manifest=root/'app/src/main/AndroidManifest.xml'
strings=root/'app/src/main/res/values/strings.xml'
build=root/'app/build.gradle'
cert=root/'trust/preview_cert_sha256.txt'
required=[manifest,strings,build,root/'settings.gradle',root/'gradle.properties',cert]
for path in required:
    assert path.is_file(),f'MISSING={path}'
android='http://schemas.android.com/apk/res/android'
xml=ET.parse(manifest).getroot()
application=xml.find('application')
assert application is not None
activities={a.attrib.get('{'+android+'}name'):a for a in application.findall('activity')}
launcher=activities.get('com.google.androidbrowserhelper.trusted.LauncherActivity')
manage=activities.get('com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity')
assert launcher is not None and launcher.attrib.get('{'+android+'}exported')=='true'
assert manage is not None and manage.attrib.get('{'+android+'}exported')=='false'
assert application.attrib.get('{'+android+'}manageSpaceActivity')=='com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity'
assert any(x.attrib.get('{'+android+'}name')=='android.support.customtabs.trusted.DEFAULT_URL' for x in launcher.findall('meta-data'))
assert any(x.attrib.get('{'+android+'}name')=='android.support.customtabs.trusted.MANAGE_SPACE_URL' for x in manage.findall('meta-data'))
ss={x.attrib.get('name'):x.text for x in ET.parse(strings).getroot().findall('string')}
assert ss['launch_url']=='https://my.angelcarehub.com/angelcare-marketplace/fr'
s=build.read_text()
assert re.search(r'compileSdk\s+36',s)
assert re.search(r'targetSdk\s+36',s)
assert "applicationIdSuffix '.preview'" in s
assert 'ANGELCARE_PREVIEW_SIGNING_MISSING' in s
assert 'signingConfig signingConfigs.angelcarePreview' in s
assert "keyAlias 'angelcare-preview'" in s
fp=cert.read_text().strip()
assert re.fullmatch(r'[0-9A-F]{2}(?::[0-9A-F]{2}){31}',fp), 'Invalid preview certificate fingerprint'
assert not any(root.rglob('*.keystore')) and not any(root.rglob('*.jks'))
assert not any(root.rglob('*.p12')) and not any(root.rglob('*.pem'))
print('ANDROID_R3_OFFLINE_CONTRACT=PASS')
print('PREVIEW_CERTIFICATE_PINNED=YES')
print('LOCAL_BUILD=NOT_INVOKED')
