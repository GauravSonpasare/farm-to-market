import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ end, duration = 2, prefix = "", suffix = "", className = "" }: CountUpProps) {
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000
  });

  const displayValue = useTransform(springValue, (latest) => {
    return `${prefix}${Math.floor(latest).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    springValue.set(end);
  }, [end, springValue]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}
