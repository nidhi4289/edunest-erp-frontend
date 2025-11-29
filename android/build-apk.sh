#!/bin/bash

# Build script that handles Java version switching for EduNest ERP
# Uses Java 21 for Capacitor plugins compatibility

echo "🚀 Building EduNest ERP APK..."

# Use Java 21 for Capacitor plugin compatibility
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.9/libexec/openjdk.jdk/Contents/Home"

echo "📋 Using Java version:"
"$JAVA_HOME/bin/java" --version

echo "🧹 Cleaning previous build..."
./gradlew clean

echo "🔧 Building debug APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ Debug build successful!"
    echo "🔧 Building release APK..."
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        echo "✅ Release build successful!"
        echo "📱 APK files generated:"
        find . -name "*.apk" -exec ls -la {} \;
        echo ""
        echo "🎉 Build completed successfully!"
        echo "📁 APK Location: android/app/build/outputs/apk/"
    else
        echo "❌ Release build failed!"
        exit 1
    fi
else
    echo "❌ Debug build failed!"
    exit 1
fi