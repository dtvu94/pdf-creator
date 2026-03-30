package com.pdfcreator.pdfa;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.math.BigInteger;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class PdfSignerTest {

    private PdfSigner signer;
    private static byte[] keystoreBytes;
    private static final String KEYSTORE_PASSWORD = "testpass";
    private static final String ALIAS = "testalias";

    @BeforeAll
    static void setUpKeystore() throws Exception {
        // Generate a self-signed certificate for testing
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        var keyPair = kpg.generateKeyPair();

        // Create self-signed cert using BouncyCastle
        var certBuilder = new org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder(
                new org.bouncycastle.asn1.x500.X500Name("CN=Test"),
                BigInteger.ONE,
                new Date(System.currentTimeMillis() - 86400000L),
                new Date(System.currentTimeMillis() + 86400000L * 365),
                new org.bouncycastle.asn1.x500.X500Name("CN=Test"),
                keyPair.getPublic()
        );
        var contentSigner = new org.bouncycastle.operator.jcajce.JcaContentSignerBuilder("SHA256withRSA")
                .build(keyPair.getPrivate());
        X509Certificate cert = new org.bouncycastle.cert.jcajce.JcaX509CertificateConverter()
                .getCertificate(certBuilder.build(contentSigner));

        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(null, KEYSTORE_PASSWORD.toCharArray());
        ks.setKeyEntry(ALIAS, keyPair.getPrivate(), KEYSTORE_PASSWORD.toCharArray(),
                new Certificate[]{cert});

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ks.store(out, KEYSTORE_PASSWORD.toCharArray());
        keystoreBytes = out.toByteArray();
    }

    @BeforeEach
    void setUp() {
        signer = new PdfSigner();
    }

    @Test
    void sign_validPdfAndKeystore_producesSignedPdf() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] signed = signer.sign(pdf, keystoreBytes, KEYSTORE_PASSWORD, "PKCS12",
                ALIAS, "Testing", "Test Location", "test@example.com");

        assertNotNull(signed);
        assertTrue(signed.length > pdf.length);
    }

    @Test
    void sign_nullAlias_usesFirst() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] signed = signer.sign(pdf, keystoreBytes, KEYSTORE_PASSWORD, "PKCS12",
                null, null, null, null);

        assertNotNull(signed);
        assertTrue(signed.length > 0);
    }

    @Test
    void sign_emptyAlias_usesFirst() throws Exception {
        byte[] pdf = TestHelper.createSimplePdf();
        byte[] signed = signer.sign(pdf, keystoreBytes, KEYSTORE_PASSWORD, "PKCS12",
                "", "Reason", "Location", "contact");

        assertNotNull(signed);
    }

    @Test
    void sign_invalidKeystoreBytes_throwsException() {
        assertThrows(Exception.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf();
            signer.sign(pdf, new byte[]{1, 2, 3}, "pass", "PKCS12",
                    null, null, null, null);
        });
    }

    @Test
    void sign_wrongPassword_throwsException() {
        assertThrows(Exception.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf();
            signer.sign(pdf, keystoreBytes, "wrongpassword", "PKCS12",
                    ALIAS, null, null, null);
        });
    }

    @Test
    void sign_nonexistentAlias_throwsException() {
        assertThrows(Exception.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf();
            signer.sign(pdf, keystoreBytes, KEYSTORE_PASSWORD, "PKCS12",
                    "nonexistent", null, null, null);
        });
    }

    @Test
    void sign_emptyKeystore_throwsException() throws Exception {
        // Create an empty keystore
        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(null, "pass".toCharArray());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ks.store(out, "pass".toCharArray());

        assertThrows(Exception.class, () -> {
            byte[] pdf = TestHelper.createSimplePdf();
            signer.sign(pdf, out.toByteArray(), "pass", "PKCS12",
                    null, null, null, null);
        });
    }
}
