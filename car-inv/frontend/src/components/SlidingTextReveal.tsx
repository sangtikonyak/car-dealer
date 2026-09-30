import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface SlidingTextRevealProps {
  readonly text: string;
  readonly delay?: number;
  readonly className?: string;
}

/** Words rise into view from an overflow mask, matching a deliberate title-sequence reveal. */
export function SlidingTextReveal({ text, delay = 0, className = '' }: SlidingTextRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <span className={`sliding-text-reveal ${className}`} aria-label={text}>
      {text
        .split(' ')
        .map((word, index) => (
          <motion.span
            className="sliding-text-mask"
            key={`${word}-${index}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.7 }}
            variants={{ hidden: {}, visible: {} }}
          >
            <motion.span
              className="sliding-text-word"
              aria-hidden="true"
              variants={{
                hidden: { y: reduceMotion ? '0%' : '115%', opacity: reduceMotion ? 1 : 0 },
                visible: { y: '0%', opacity: 1 },
              }}
              transition={{
                duration: reduceMotion ? 0 : 0.56,
                delay: reduceMotion ? 0 : delay + index * 0.075,
                ease: [0.22, 0.8, 0.2, 1],
              }}
            >
              {word}
            </motion.span>
          </motion.span>
        ))
        .reduce<ReactNode[]>((children, child, index) => {
          if (index === 0) return [child];
          return [...children, ' ', child];
        }, [])}
    </span>
  );
}
