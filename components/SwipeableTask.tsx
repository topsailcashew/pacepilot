import React, { useState, useRef, useEffect } from 'react';
import { Check, Trash2, Copy } from 'lucide-react';

interface SwipeableTaskProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isCompleted?: boolean;
  disabled?: boolean;
}

const SwipeableTask: React.FC<SwipeableTaskProps> = ({
  children,
  onComplete,
  onDelete,
  onDuplicate,
  isCompleted = false,
  disabled = false,
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Swipe thresholds
  const SWIPE_THRESHOLD = 80; // Minimum distance to trigger action
  const MAX_SWIPE = 150; // Maximum swipe distance
  const SNAP_THRESHOLD = 60; // Distance to snap to action position

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;

    // Apply resistance at the edges
    let newOffset = diff;
    if (Math.abs(diff) > MAX_SWIPE) {
      const excess = Math.abs(diff) - MAX_SWIPE;
      const resistance = 1 - (excess / 200); // Diminishing returns
      newOffset = diff > 0
        ? MAX_SWIPE + (excess * Math.max(resistance, 0.1))
        : -MAX_SWIPE - (excess * Math.max(resistance, 0.1));
    }

    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);

    // Determine action based on swipe distance
    if (offset < -SWIPE_THRESHOLD) {
      // Swiped left - Delete action
      if (Math.abs(offset) >= SNAP_THRESHOLD) {
        animateToPosition(-MAX_SWIPE, () => {
          if (onDelete) {
            setTimeout(() => {
              onDelete();
              resetPosition();
            }, 200);
          } else {
            resetPosition();
          }
        });
      } else {
        resetPosition();
      }
    } else if (offset > SWIPE_THRESHOLD) {
      // Swiped right - Complete action
      if (offset >= SNAP_THRESHOLD) {
        animateToPosition(MAX_SWIPE, () => {
          if (onComplete) {
            setTimeout(() => {
              onComplete();
              resetPosition();
            }, 200);
          } else {
            resetPosition();
          }
        });
      } else {
        resetPosition();
      }
    } else {
      // Not enough distance - reset
      resetPosition();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    // Only enable on mobile devices or when touch events aren't available
    if (window.innerWidth <= 768) {
      setIsDragging(true);
      setStartX(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;

    const currentX = e.clientX;
    const diff = currentX - startX;

    let newOffset = diff;
    if (Math.abs(diff) > MAX_SWIPE) {
      const excess = Math.abs(diff) - MAX_SWIPE;
      const resistance = 1 - (excess / 200);
      newOffset = diff > 0
        ? MAX_SWIPE + (excess * Math.max(resistance, 0.1))
        : -MAX_SWIPE - (excess * Math.max(resistance, 0.1));
    }

    setOffset(newOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled) return;
    handleTouchEnd();
  };

  const animateToPosition = (targetOffset: number, callback?: () => void) => {
    const startOffset = offset;
    const duration = 200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      setOffset(currentOffset);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (callback) callback();
      }
    };

    animate();
  };

  const resetPosition = () => {
    animateToPosition(0);
  };

  const getActionOpacity = (side: 'left' | 'right') => {
    const absOffset = Math.abs(offset);
    if (side === 'left' && offset < 0) {
      return Math.min(absOffset / SNAP_THRESHOLD, 1);
    }
    if (side === 'right' && offset > 0) {
      return Math.min(absOffset / SNAP_THRESHOLD, 1);
    }
    return 0;
  };

  const getActionScale = (side: 'left' | 'right') => {
    const absOffset = Math.abs(offset);
    if (side === 'left' && offset < 0) {
      return 0.8 + (Math.min(absOffset / SNAP_THRESHOLD, 1) * 0.2);
    }
    if (side === 'right' && offset > 0) {
      return 0.8 + (Math.min(absOffset / SNAP_THRESHOLD, 1) * 0.2);
    }
    return 0.8;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Left action (Delete) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 pointer-events-none"
        style={{
          opacity: getActionOpacity('left'),
          transform: `scale(${getActionScale('left')})`,
          transition: isDragging ? 'none' : 'opacity 0.2s, transform 0.2s',
        }}
      >
        <div className="flex items-center gap-3">
          {onDuplicate && (
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Copy size={20} className="text-white" />
            </div>
          )}
          {onDelete && (
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Trash2 size={20} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Right action (Complete/Uncomplete) */}
      {onComplete && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-6 pointer-events-none"
          style={{
            opacity: getActionOpacity('right'),
            transform: `scale(${getActionScale('right')})`,
            transition: isDragging ? 'none' : 'opacity 0.2s, transform 0.2s',
          }}
        >
          <div className={`w-12 h-12 ${isCompleted ? 'bg-yellow-500' : 'bg-green-500'} rounded-full flex items-center justify-center shadow-lg`}>
            <Check size={20} className="text-white" />
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging) {
            handleMouseUp();
          }
        }}
        className={`relative ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableTask;
