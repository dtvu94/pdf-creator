package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.Security;

public class PdfEncryptor {

    static {
        // Register BouncyCastle provider for AES-256 encryption support
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    /**
     * Encrypt a PDF with user/owner passwords.
     *
     * @param pdfBytes      source PDF
     * @param userPassword  password required to open the PDF
     * @param ownerPassword password for full access (defaults to userPassword)
     * @param keyLength     encryption key length: 128 or 256 (default 128)
     * @param permissions   bitfield — 4 = allow printing only (same as muhammara default)
     * @return encrypted PDF bytes
     */
    public byte[] encrypt(byte[] pdfBytes, String userPassword, String ownerPassword,
                          int keyLength, int permissions) throws IOException {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            AccessPermission ap = new AccessPermission(permissions);

            StandardProtectionPolicy policy = new StandardProtectionPolicy(
                    ownerPassword != null ? ownerPassword : userPassword,
                    userPassword,
                    ap);
            policy.setEncryptionKeyLength(keyLength);

            doc.protect(policy);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }
}
