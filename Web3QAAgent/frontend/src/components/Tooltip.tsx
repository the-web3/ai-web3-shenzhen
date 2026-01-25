import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-amber-600 hover:text-amber-700 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${
              position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
              'left-full ml-2 top-1/2 -translate-y-1/2'
            }`}
          >
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg px-3 py-2 shadow-lg max-w-xs">
              <p className="text-xs text-amber-900 whitespace-normal">{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
