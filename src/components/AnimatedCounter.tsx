import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter = ({ value, duration = 1200, prefix = "", suffix = "" }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState("0");
  const prevValue = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const numVal = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
    if (isNaN(numVal)) {
      setDisplayValue(String(value));
      return;
    }

    const start = prevValue.current;
    const end = numVal;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      if (Number.isInteger(end)) {
        setDisplayValue(Math.round(current).toLocaleString());
      } else {
        setDisplayValue(current.toFixed(1));
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span>{prefix}{displayValue}{suffix}</span>;
};

export default AnimatedCounter;
