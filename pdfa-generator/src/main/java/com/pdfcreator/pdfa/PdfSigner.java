package com.pdfcreator.pdfa;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.asn1.cms.CMSObjectIdentifiers;
import org.bouncycastle.cms.*;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;

import java.io.*;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.*;
import java.util.logging.Logger;

public class PdfSigner implements SignatureInterface {

    private static final Logger LOG = Logger.getLogger(PdfSigner.class.getName());

    private PrivateKey privateKey;
    private Certificate[] certificateChain;

    /**
     * Sign a PDF document.
     *
     * @param pdfBytes         source PDF
     * @param keystoreBytes    PKCS12/JKS keystore bytes
     * @param keystorePassword keystore password
     * @param keystoreType     "PKCS12" or "JKS"
     * @param alias            key alias (null = use first)
     * @param reason           signature reason
     * @param location         signature location
     * @param contactInfo      signer contact info
     * @return signed PDF bytes
     */
    public byte[] sign(byte[] pdfBytes, byte[] keystoreBytes, String keystorePassword,
                       String keystoreType, String alias, String reason,
                       String location, String contactInfo) throws Exception {

        // Load keystore
        KeyStore keystore = KeyStore.getInstance(keystoreType);
        keystore.load(new ByteArrayInputStream(keystoreBytes), keystorePassword.toCharArray());

        // Resolve alias
        if (alias == null || alias.isEmpty()) {
            Enumeration<String> aliases = keystore.aliases();
            if (aliases.hasMoreElements()) {
                alias = aliases.nextElement();
            } else {
                throw new IllegalArgumentException("Keystore contains no entries");
            }
        }

        this.privateKey = (PrivateKey) keystore.getKey(alias, keystorePassword.toCharArray());
        this.certificateChain = keystore.getCertificateChain(alias);

        if (privateKey == null || certificateChain == null) {
            throw new IllegalArgumentException("No private key found for alias: " + alias);
        }

        // Sign the document
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDSignature signature = new PDSignature();
            signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
            signature.setSubFilter(PDSignature.SUBFILTER_ADBE_PKCS7_DETACHED);
            signature.setSignDate(Calendar.getInstance());

            if (reason != null) signature.setReason(reason);
            if (location != null) signature.setLocation(location);
            if (contactInfo != null) signature.setContactInfo(contactInfo);

            String signerName = ((X509Certificate) certificateChain[0])
                    .getSubjectX500Principal().getName();
            signature.setName(signerName);

            doc.addSignature(signature, this);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.saveIncremental(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] sign(InputStream content) throws IOException {
        try {
            // Build CMS signed data (PKCS#7 detached signature)
            List<Certificate> certList = Arrays.asList(certificateChain);
            CMSSignedDataGenerator gen = new CMSSignedDataGenerator();

            ContentSigner sha256Signer = new JcaContentSignerBuilder("SHA256withRSA")
                    .build(privateKey);

            gen.addSignerInfoGenerator(
                    new JcaSignerInfoGeneratorBuilder(
                            new JcaDigestCalculatorProviderBuilder().build())
                            .build(sha256Signer, (X509Certificate) certificateChain[0]));

            gen.addCertificates(new JcaCertStore(certList));

            CMSProcessableInputStream msg = new CMSProcessableInputStream(content);
            CMSSignedData signedData = gen.generate(msg, false);

            return signedData.getEncoded();
        } catch (Exception e) {
            throw new IOException("Signing failed", e);
        }
    }

    /**
     * Wraps an InputStream as CMSTypedData for BouncyCastle CMS signing.
     */
    private static class CMSProcessableInputStream implements CMSTypedData {
        private final InputStream inputStream;

        CMSProcessableInputStream(InputStream is) {
            this.inputStream = is;
        }

        @Override
        public void write(OutputStream out) throws IOException {
            inputStream.transferTo(out);
        }

        @Override
        public Object getContent() {
            return inputStream;
        }

        @Override
        public org.bouncycastle.asn1.ASN1ObjectIdentifier getContentType() {
            return CMSObjectIdentifiers.data;
        }
    }
}
