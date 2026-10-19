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
activity=xml.find('.//activity')
assert activity is not None
assert activity.attrib.get('{'+android+'}name')=='com.google.androidbrowserhelper.trusted.LauncherActivity'
assert activity.attrib.get('{'+android+'}exported')=='true'
assert any(x.attrib.get('{'+android+'}name')=='android.support.customtabs.trusted.DEFAULT_URL' for x in activity.findall('meta-data'))
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
