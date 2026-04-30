package com.stockmaster.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.oned.Code128Writer;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class CodeImageService {

    public String barcodeDataUri(String value) {
        return encodeToPngDataUri(new Code128Writer(), BarcodeFormat.CODE_128, value, 360, 90);
    }

    public String qrDataUri(String value) {
        return encodeToPngDataUri(new QRCodeWriter(), BarcodeFormat.QR_CODE, value, 280, 280);
    }

    private String encodeToPngDataUri(com.google.zxing.Writer writer, BarcodeFormat format, String value, int width, int height) {
        try {
            BitMatrix matrix = writer.encode(value, format, width, height);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (WriterException | IOException ex) {
            throw new IllegalArgumentException("Unable to render code image for value: " + value);
        }
    }
}
