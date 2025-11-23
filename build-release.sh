#!/bin/bash

# Build script for EduNest ERP Android App
echo "Building EduNest ERP for Google Play Store..."

# Check if keystore.properties exists
if [ ! -f "android/keystore.properties" ]; then
    echo "Error: keystore.properties not found!"
    exit 1
fi

# Check if keystore file exists
if [ ! -f "android/edunest-erp-release-key.keystore" ]; then
    echo "Error: Keystore file not found!"
    exit 1
fi

# Prompt for keystore password
echo "Please enter your keystore password:"
read -s KEYSTORE_PASSWORD

# Update keystore.properties with the password
sed -i.backup "s/your_keystore_password/$KEYSTORE_PASSWORD/g" android/keystore.properties

echo "Building production web app..."
npm run build

echo "Syncing to Android..."
npx cap sync android

echo "Building Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease

echo "Building signed APK..."
./gradlew assembleRelease

echo ""
echo "Build completed!"
echo "Files generated:"
echo "- AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo "- APK: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Upload the AAB file to Google Play Console for distribution."

# Restore original keystore.properties
mv android/keystore.properties.backup android/keystore.properties