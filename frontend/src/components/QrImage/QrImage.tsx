"use client";

import { useEffect, useState } from "react";

interface QrImageProps {
  huntId: number;
  treasureId: number;
  alt: string;
  className?: string;
  clickable?: boolean;
}

export default function QrImage({
  huntId,
  treasureId,
  alt,
  className,
  clickable = true,
}: QrImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE ||
          (process.env.NODE_ENV === "development"
            ? "http://localhost:3001/api"
            : "/api");

        const response = await fetch(
          `${API_BASE}/hunts/${huntId}/treasures/${treasureId}/qr`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [huntId, treasureId, imageSrc]);

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
