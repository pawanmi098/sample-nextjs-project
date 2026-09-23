import * as React from "react";
import HTMLFlipBook from "react-pageflip";

interface PageData {
  id: string | number;
  imageUrl: string;
}

// react-pageflip needs each page to be a forwardRef component
const Page = React.forwardRef<HTMLDivElement, { image: string }>(({ image }, ref) => (
  <div ref={ref} style={{ background: "#fff" }}>
    <img
      src={image}
      alt=""
      draggable={false}
      style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }}
    />
  </div>
));

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const FlipBookViewer: React.FC<{ pages: PageData[] }> = ({ pages }) => {
  const bookRef = React.useRef<any>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null); // fixed-size window, overflow hidden
  const contentRef = React.useRef<HTMLDivElement>(null);  // the part that moves/scales

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [previousPage, setPreviousPage] = React.useState(1);

  const [zoom, setZoomState] = React.useState(1);
  const [panOffset, setPanState] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);

  // Refs mirror state so the native touch/mouse listeners always see current values
  const zoomRef = React.useRef(1);
  const panRef = React.useRef({ x: 0, y: 0 });
  const setZoom = (z: number) => { zoomRef.current = z; setZoomState(z); };
  const setPanOffset = (p: { x: number; y: number }) => { panRef.current = p; setPanState(p); };

  const isZoomed = zoom > 1;

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Stop the image being dragged past its edges
  const clamp = (x: number, y: number, z: number) => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return { x, y };
    const maxX = Math.max(0, (ct.offsetWidth * z - vp.clientWidth) / 2);
    const maxY = Math.max(0, (ct.offsetHeight * z - vp.clientHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const applyZoom = (next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoom(z);
    const p = panRef.current;
    setPanOffset(z === 1 ? { x: 0, y: 0 } : clamp(p.x, p.y, z));
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse-wheel zoom (non-passive so the page itself doesn't scroll)
  React.useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  // ANDROID FIX: native touch + mouse listeners, attached in the CAPTURE phase
  // with passive: false. This lets us:
  //  - stop HTMLFlipBook from seeing the drag while zoomed (stopPropagation)
  //  - stop Android Chrome from taking over the gesture (preventDefault),
  //    which is what fires pointercancel and kills the pan on Android.
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let start: { x: number; y: number; panX: number; panY: number } | null = null;

    const begin = (x: number, y: number) => {
      start = { x, y, panX: panRef.current.x, panY: panRef.current.y };
      setIsDragging(true);
    };
    const move = (x: number, y: number) => {
      if (!start) return;
      setPanOffset(clamp(start.panX + (x - start.x), start.panY + (y - start.y), zoomRef.current));
    };
    const end = () => {
      start = null;
      setIsDragging(false);
    };

    // Touch (Android + iOS)
    const onTouchStart = (e: TouchEvent) => {
      if (zoomRef.current <= 1 || e.touches.length !== 1) return; // not zoomed: let the book flip
      e.stopPropagation();
      e.preventDefault();
      begin(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!start) return;
      e.stopPropagation();
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return;
      e.stopPropagation();
      end();
    };

    // Mouse (desktop)
    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onMouseUp = () => {
      end();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (zoomRef.current <= 1) return;
      e.stopPropagation();
      e.preventDefault();
      begin(e.clientX, e.clientY);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const opts: AddEventListenerOptions = { capture: true, passive: false };
    el.addEventListener("touchstart", onTouchStart, opts);
    el.addEventListener("touchmove", onTouchMove, opts);
    el.addEventListener("touchend", onTouchEnd, opts);
    el.addEventListener("touchcancel", onTouchEnd, opts);
    el.addEventListener("mousedown", onMouseDown, opts);

    return () => {
      el.removeEventListener("touchstart", onTouchStart, opts);
      el.removeEventListener("touchmove", onTouchMove, opts);
      el.removeEventListener("touchend", onTouchEnd, opts);
      el.removeEventListener("touchcancel", onTouchEnd, opts);
      el.removeEventListener("mousedown", onMouseDown, opts);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const goNext = () => {
    resetZoom();
    bookRef.current?.pageFlip()?.flipNext();
  };

  const goPrev = () => {
    resetZoom();
    bookRef.current?.pageFlip()?.flipPrev();
  };

  return (
    <div>
      {/* Viewport: fixed window, no scrollbars */}
      <div
        ref={viewportRef}
        style={{
          overflow: "hidden",
          touchAction: isZoomed ? "none" : "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Content: scaled + moved with transform */}
        <div
          ref={contentRef}
          onDoubleClick={resetZoom}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "default",
            userSelect: "none",
            touchAction: isZoomed ? "none" : "auto",
          }}
        >
          <HTMLFlipBook
            key={isMobile ? "mobile" : "desktop"}
            ref={bookRef}
            width={500}
            height={650}
            minWidth={400}
            maxWidth={900}
            minHeight={600}
            maxHeight={1200}
            size="stretch"
            autoSize={false}
            usePortrait={isMobile}
            showCover={true}
            drawShadow={false}
            maxShadowOpacity={0.2}
            showPageCorners={true}
            flippingTime={200}
            startPage={currentPage - 1}
            onFlip={(e: any) => {
              setPreviousPage(currentPage);
              setCurrentPage(e.data + 1);
              resetZoom();
            }}
            {...({} as any)}
          >
            {pages.map((page) => (
              <Page key={page.id} image={page.imageUrl} />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        {currentPage > 1 && (
          <button type="button" onClick={goPrev}>Previous</button>
        )}
        <button type="button" onClick={() => applyZoom(zoom / 1.25)} disabled={zoom <= MIN_ZOOM}>
          Zoom out
        </button>
        <button type="button" onClick={resetZoom} disabled={!isZoomed}>
          Reset
        </button>
        <button type="button" onClick={() => applyZoom(zoom * 1.25)} disabled={zoom >= MAX_ZOOM}>
          Zoom in
        </button>
        {currentPage < pages.length && (
          <button type="button" onClick={goNext}>Next</button>
        )}
      </div>
    </div>
  );
};

export default FlipBookViewer;
