import React from "react";

import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  ))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  AvatarImageProps
>(({ className, dbAvatarUrl, clerkAvatarUrl, ...props }, ref) => {
  const [src, setSrc] = React.useState<string | null>(null);
  const [triedDb, setTriedDb] = React.useState(false);
  const [triedClerk, setTriedClerk] = React.useState(false);

  React.useEffect(() => {
    // Determine the initial source to try
    let newSrc: string | null = null;
    if (dbAvatarUrl) {
      newSrc = dbAvatarUrl;
      setTriedDb(true);
    } else if (clerkAvatarUrl) {
      newSrc = clerkAvatarUrl;
      setTriedClerk(true);
    }
    setSrc(newSrc);
  }, [dbAvatarUrl, clerkAvatarUrl]);

  const handleError = React.useCallback(() => {
    if (triedDb && !triedClerk && clerkAvatarUrl) {
      // DB failed, try Clerk
      setSrc(clerkAvatarUrl);
      setTriedClerk(true);
    } else {
      // Either clerk failed or no clerk URL, or we didn't try DB because it was empty
      // Set to null to show fallback
      setSrc(null);
    }
  }, [triedDb, triedClerk, clerkAvatarUrl]);

  if (!src) {
    return null; // Let fallback show
  }

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      src={src}
      onError={handleError}
      {...props}
    />
  ));
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  dbAvatarUrl?: string | null;
  clerkAvatarUrl?: string | null;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
