import React, { useEffect } from "react";

export default function ImageLightbox({
  isOpen,
  images,
  activeIndex,
  onClose,
  onPrevious,
  onNext,
  altBase
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious();
      if (event.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!isOpen || !images?.length) return null;

  const hasMultiple = images.length > 1;

  return (
    <div className="photo-lightbox-backdrop" onClick={onClose}>
      <div className="photo-lightbox" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="photo-lightbox-close"
          onClick={onClose}
          aria-label="Fermer la vue agrandie"
        >
          ✕
        </button>

        {hasMultiple && (
          <button
            type="button"
            className="photo-lightbox-nav photo-lightbox-prev"
            onClick={onPrevious}
            aria-label="Image précédente"
          >
            ‹
          </button>
        )}

        <img
          src={images[activeIndex]}
          alt={altBase ? `${altBase} - image ${activeIndex + 1}` : "Image agrandie"}
        />

        {hasMultiple && (
          <button
            type="button"
            className="photo-lightbox-nav photo-lightbox-next"
            onClick={onNext}
            aria-label="Image suivante"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
