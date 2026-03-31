import { useRef, useState, useEffect } from "react";

export const ScrollableTitle = ({ title, baseClass }: { title: string; baseClass: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, [title]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden mb-3 relative ${shouldScroll ? 'mask-image-edges' : 'flex justify-center'}`}
      style={shouldScroll ? { WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" } : {}}
    >
      <div className={shouldScroll ? "w-max animate-marquee whitespace-nowrap flex" : "w-full text-center flex flex-col items-center"}>
        <h2 ref={textRef} className={`${baseClass} ${shouldScroll ? 'pr-8' : 'line-clamp-2'}`}>
          {title}
        </h2>
        {shouldScroll && (
          <h2 className={`${baseClass} pr-8`}>
            {title}
          </h2>
        )}
      </div>
    </div>
  );
};
