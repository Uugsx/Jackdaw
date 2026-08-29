#!/usr/bin/env bash

source ../hooks/ios/variables.sh
export ANDROID_LIBNODE="https://github.com/nodejs-mobile/nodejs-mobile/releases/download/v18.20.4/nodejs-mobile-v18.20.4-android.zip"
export ANDROID_SDK="--sdk35"
export IOS_LIBNODE

cd node_modules;
(cd better-sqlite3 && npx prebuild-for-nodejs-mobile $MOBILE_ARCH $ANDROID_SDK) &&
(cd bufferutil && npx prebuild-for-nodejs-mobile $MOBILE_ARCH $ANDROID_SDK)

unset ANDROID_LIBNODE
unset ANDROID_SDK
unset IOS_LIBNODE
