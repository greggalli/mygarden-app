import React, { useState } from "react";

export default function HoverPreviewImage({ src, alt, className, previewClassName }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!src) return null;

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <img src={src} loading="lazy" alt={alt} />
      {isHovered && (
        <div className={previewClassName} role="tooltip" aria-hidden="true">
          <img src={src} alt="" />
        </div>
      )}
    </div>
  );
}
