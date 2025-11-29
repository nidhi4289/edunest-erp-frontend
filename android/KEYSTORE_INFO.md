# EduNest ERP - Keystore Information

## Upload Keystore Details
- **File**: `upload-keystore.jks`
- **Alias**: `upload`
- **Store Password**: `EduNest@2025`
- **Key Password**: `EduNest@2025`
- **Algorithm**: RSA 2048-bit
- **Validity**: 25,000 days (until May 4, 2094)

## Certificate Fingerprints
- **SHA1**: `26:57:C8:1C:37:48:F9:6C:FD:0A:E3:8D:38:5E:C2:84:85:B0:F5:93`
- **SHA256**: `91:28:86:2B:06:16:DC:EE:9C:22:21:F9:E3:22:2D:A2:11:87:5C:A3:14:84:2A:C0:E3:19:14:76:F4:00:03:71`

## Certificate Details
- **Owner**: CN=EduNest ERP, OU=EduNest Technologies, O=EduNest, L=Mumbai, ST=Maharashtra, C=IN
- **Valid From**: November 22, 2025
- **Valid Until**: May 4, 2094
- **Serial Number**: 1a1b4267ddb6c78a

## Files Generated
- `upload-keystore.jks` - The keystore file (keep secure!)
- `upload-key-certificate.pem` - Public certificate for Google Play Console

## ⚠️ SECURITY NOTES
1. **NEVER** share the `.jks` file
2. **ALWAYS** backup the keystore in a secure location
3. Store passwords securely (consider using a password manager)
4. This keystore is specifically for uploading to Google Play Console
5. Google will manage the actual app signing key

## Google Play Console Setup
1. Go to Play Console → Release → Setup → App Signing
2. Select "Let Google manage and protect your app signing key"
3. Upload the `upload-key-certificate.pem` file
4. Google will generate the app signing key automatically