"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrImageProps {
  qrCodeData: string;
  alt: string;
  className?: string;
  clickable?: boolean;
}

export default function QrImage({
  qrCodeData,
  alt,
  className,
  clickable = true,
}: QrImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        setError(false);

        const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
          width: 200,
          margin: 2,
          color: {
            dark: "#8B4513", // Pirate brown
            light: "#FFF8DC", // Cornsilk background
          },
        });

        setImageSrc(qrCodeUrl);
      } catch (err) {
        setError(true);
        console.error("Error generating QR code:", err);
      } finally {
        setLoading(false);
      }
    };

    if (qrCodeData) {
      generateQRCode();
    }
  }, [qrCodeData]);

  if (loading) {
    return <div className={className}>Loading QR code...</div>;
  }

  if (error) {
    return <div className={className}>Failed to load QR code</div>;
  }

  const imageElement = <img src={imageSrc} alt={alt} className={className} />;

  if (clickable && imageSrc) {
    return (
      <a
        href={imageSrc}
        target="_blank"
        rel="noopener noreferrer"
        title="Click to view QR code in full size"
      >
        {imageElement}
      </a>
    );
  }

  return imageElement;
}
