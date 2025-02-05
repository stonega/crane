---
title: Flutter
description: Flutter tips.
permalink: tips/{{ title | slug }}/index.html
icon: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-plain.svg
---

- If your app include ffi code, you need to change build config before release. In Xcode, go to Target Runner > Build Settings > Strip Style. Change from All Symbols to Non-Global Symbols.
- Get key alias from jsk file `keytool -v -list -keystore **.jks`
- Set java version `flutter config --jdk-dir=$JAVA_HOME`
