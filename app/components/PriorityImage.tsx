"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { resolveImageLoadingStrategy, type ImageSkeletonState } from "../lib/hero-image";

type PriorityImageProps = Omit<ImageProps, "priority" | "preload" | "loading"> & {
  priority?: boolean;
  eager?: boolean;
  skeleton?: boolean;
  skeletonClassName?: string;
};

/**
 * Renders a Next.js `<Image>` with explicit priority/eager loading attributes
 * and an optional architectural skeleton shimmer layered behind the image until
 * load completes so initial paint is never delayed and layout stays locked.
 */
export function PriorityImage({
  priority = false,
  eager = false,
  skeleton,
  skeletonClassName,
  src,
  alt,
  onLoad,
  onError,
  ...rest
}: PriorityImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const srcKey = typeof src === "string" ? src : JSON.stringify(src);
  const [status, setStatus] = useState<{ key: string; state: ImageSkeletonState }>({
    key: srcKey,
    state: "loading",
  });

  const effectiveState: ImageSkeletonState = status.key === srcKey ? status.state : "loading";
  const showSkeleton = skeleton ?? priority;
  const strategy = resolveImageLoadingStrategy({ priority, eager });

  useEffect(() => {
    if (!showSkeleton) return;
    const img = imgRef.current;
    if (!img || !img.complete) return;
    setStatus((current) => {
      if (current.key === srcKey && current.state !== "loading") return current;
      return { key: srcKey, state: img.naturalWidth > 0 ? "loaded" : "error" };
    });
  }, [showSkeleton, srcKey]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setStatus({ key: srcKey, state: "loaded" });
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setStatus({ key: srcKey, state: "error" });
    onError?.(event);
  };

  const skeletonClasses = skeletonClassName
    ? `hero-image-skeleton ${skeletonClassName}`
    : "hero-image-skeleton";

  return (
    <>
      {showSkeleton ? (
        <span
          className={skeletonClasses}
          data-image-state={effectiveState}
          aria-hidden="true"
        />
      ) : null}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        preload={strategy.preload}
        loading={strategy.loading}
        fetchPriority={strategy.fetchPriority}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />
    </>
  );
}
