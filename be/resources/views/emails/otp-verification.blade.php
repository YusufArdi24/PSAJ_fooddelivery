<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi Warung Edin</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px 24px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">🍽️ Warung Edin</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Verifikasi Email Anda</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 28px;">
                            <p style="margin:0 0 8px;color:#374151;font-size:15px;">Halo, <strong>{{ $recipientName }}</strong>!</p>
                            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                                Terima kasih telah mendaftar di Warung Edin. Masukkan kode berikut di aplikasi untuk memverifikasi email Anda:
                            </p>

                            <!-- OTP Box -->
                            <div style="background:#fff7ed;border:2px dashed #f97316;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                                <p style="margin:0 0 4px;color:#9a3412;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Kode Verifikasi</p>
                                <p style="margin:0;color:#ea580c;font-size:40px;font-weight:800;letter-spacing:10px;">{{ $otp }}</p>
                            </div>

                            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center;">
                                ⏰ Kode berlaku selama <strong>10 menit</strong>
                            </p>
                            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                                Jangan bagikan kode ini kepada siapapun. Tim Warung Edin tidak pernah memintanya.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb;padding:18px 28px;border-top:1px solid #f3f4f6;">
                            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                                Jika Anda tidak mendaftar di Warung Edin, abaikan email ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
