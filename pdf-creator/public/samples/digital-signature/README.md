# Digital Signature Sample

## Files

| File | Description |
|---|---|
| `sample-keystore.p12` | Self-signed PKCS#12 keystore for testing |

## Keystore Details

- **Type:** PKCS#12
- **Password:** `changeit`
- **Alias:** `signer`
- **Subject:** CN=John Doe, O=Acme Corporation, L=Ho Chi Minh City, C=VN
- **Key:** RSA 2048-bit
- **Validity:** 10 years (self-signed, for testing only)

## How to Use

1. In the PDF Creator editor, click the **Sign** button in the toolbar
2. Click **Export PDF** — the wizard will show a "Signature" step
3. Upload `sample-keystore.p12` as the keystore file
4. Enter `changeit` as the password
5. Optionally fill in reason, location, and contact info
6. Export — the PDF will be digitally signed

## Creating Your Own Keystore

```bash
# Generate a self-signed keystore
keytool -genkeypair \
  -alias mykey \
  -keyalg RSA \
  -keysize 2048 \
  -validity 365 \
  -storetype PKCS12 \
  -keystore my-keystore.p12 \
  -storepass mypassword \
  -dname "CN=Your Name, O=Your Org, C=US"
```

For production use, obtain a certificate from a trusted Certificate Authority (CA).
