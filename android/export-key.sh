#!/bin/bash

# EduNest ERP - PEPK Tool Usage Instructions
# ===========================================

echo "🔐 EduNest ERP - PEPK Key Export Tool"
echo "======================================"

# Check if encryption public key exists
if [ ! -f "encryption_public_key.pem" ]; then
    echo "❌ Error: encryption_public_key.pem not found!"
    echo ""
    echo "📋 Steps to get the encryption key:"
    echo "1. Go to Google Play Console → Your App → Release → Setup → App Signing"
    echo "2. Select 'Export and upload a key from Java keystore'"
    echo "3. Download the 'encryption_public_key.pem' file"
    echo "4. Place it in this directory: $(pwd)"
    echo ""
    exit 1
fi

# Check if PEPK tool exists
if [ ! -f "pepk.jar" ]; then
    echo "❌ Error: pepk.jar not found!"
    echo "Downloading PEPK tool..."
    curl -o pepk.jar https://www.gstatic.com/play-apps-publisher-rapid/signing-tool/prod/pepk.jar
fi

echo "🚀 Running PEPK tool to export encrypted private key..."
echo ""

# Run PEPK tool with your keystore details
java -jar pepk.jar \
    --keystore=upload-keystore.jks \
    --alias=upload \
    --output=edunest-erp-encrypted-key.zip \
    --include-cert \
    --rsa-aes-encryption \
    --encryption-key-path=encryption_public_key.pem

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Encrypted key exported to: edunest-erp-encrypted-key.zip"
    echo ""
    echo "📤 Next Steps:"
    echo "1. Go to Google Play Console → App Signing"
    echo "2. Upload the file: edunest-erp-encrypted-key.zip"
    echo "3. Google will verify and set up your app signing"
    echo ""
    echo "📁 Files created:"
    ls -la edunest-erp-encrypted-key.zip 2>/dev/null || echo "   (File not found - check for errors above)"
else
    echo "❌ Error occurred during key export. Check the output above."
fi