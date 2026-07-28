import React from "react";

import { getAvatarUrl } from "@/lib/utils";

interface AvatarFallbackImgProps {
  dbAvatarUrl?: string | null | undefined;
  clerkAvatarUrl: string | null | undefined;
  alt?: string;
  className?: string;
}

export const AvatarFallbackImg = React.memo(
  ({
    dbAvatarUrl,
    clerkAvatarUrl,
    alt = "Avatar",
    className = "",
  }: AvatarFallbackImgProps) => {
    const [src, setSrc] = React.useState<string | null>(() => {
      return getAvatarUrl(dbAvatarUrl, clerkAvatarUrl);
    });

    const handleError = React.useCallback(() => {
      if (src === dbAvatarUrl && clerkAvatarUrl) {
        // DB failed, try Clerk
        setSrc(clerkAvatarUrl);
      } else {
        // Clerk failed or no Clerk URL, give up
        setSrc(null);
      }
    }, [src, dbAvatarUrl, clerkAvatarUrl]);

    if (!src) {
      return null;
    }

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={handleError}
      />
    );
  }
);
