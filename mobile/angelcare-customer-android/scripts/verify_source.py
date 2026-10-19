#!/usr/bin/env python3
"""Offline project-only static gate. No networking, builds or Git writes."""
from pathlib import Path
from xml.etree import ElementTree as ET
import re
root=Path(__file__).resolve().parents[1]
manifest=root/'app/src/main/AndroidManifest.xml'
strings=root/'app/src/main/res/values/strings.xml'
build=root/'app/build.gradle'
required=[manifest,strings,build,root/'settings.gradle',root/'gradle.properties']
for path in required:
    assert path.is_file(),f'MISSING={path}'
android='http://schemas.android.com/apk/res/android'
xml=ET.parse(manifest).getroot()
activity=next((a for a in xml.findall('.//activity') if a.attrib.get('{'+android+'}name')=='com.google.androidbrowserhelper.trusted.LauncherActivity'),None)
assert activity is not None
assert activity.attrib.get('{'+android+'}name')=='com.google.androidbrowserhelper.trusted.LauncherActivity'
assert activity.attrib.get('{'+android+'}exported')=='true'
assert any(x.attrib.get('{'+android+'}name')=='android.support.customtabs.trusted.DEFAULT_URL' for x in activity.findall('meta-data'))
# Regression gate: class is referenced by ABH LauncherActivity on Android 7.1+.
application=xml.find('application')
assert application is not None
manage_class='com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity'
assert application.attrib.get('{'+android+'}manageSpaceActivity')==manage_class
manage=next((a for a in application.findall('activity') if a.attrib.get('{'+android+'}name')==manage_class),None)
assert manage is not None, 'Missing ManageDataLauncherActivity in manifest'
assert manage.attrib.get('{'+android+'}exported')=='false'
assert any(n.attrib.get('{'+android+'}name')=='android.support.customtabs.trusted.MANAGE_SPACE_URL' and n.attrib.get('{'+android+'}value')=='@string/launch_url' for n in manage.findall('meta-data'))
ss={x.attrib.get('name'):x.text for x in ET.parse(strings).getroot().findall('string')}
assert ss['launch_url']=='https://my.angelcarehub.com/angelcare-marketplace/fr'
gradle=build.read_text()
assert re.search(r'compileSdk\s+36',gradle)
assert re.search(r'targetSdk\s+36',gradle)
assert "applicationIdSuffix '.preview'" in gradle
assert 'signingConfig signingConfigs' not in gradle
assert not any(root.rglob('*.keystore')) and not any(root.rglob('*.jks'))
print('ANDROID_STATIC_SOURCE_GATE=PASS')
print('LOCAL_BUILD=NOT_INVOKED')
