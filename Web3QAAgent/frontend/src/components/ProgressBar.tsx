import React from 'react';
import { motion } from 'motion/react';
import { FileText, Database, Network, MessageSquare } from 'lucide-react';
import type { Step } from '../App';

interface ProgressBarProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}

const steps = [
  { number: 1, title: '输入文档', icon: FileText },
  { number: 2, title: '提取信息', icon: Database },
  { number: 3, title: '构建知识图谱', icon: Network },
  { number: 4, title: '智能问答', icon: MessageSquare },
];

export function ProgressBar({ currentStep, onStepClick }: ProgressBarProps) {
  return (
    <div className="glass border-b border-[var(--border)] py-8">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="flex items-center justify-between relative">
          {/* Visual Thread - Background line */}
          <div className="absolute top-7 left-0 right-0 h-[2px] bg-[var(--border-subtle)] -z-10" 
               style={{ marginLeft: '2.5rem', marginRight: '2.5rem' }} />
          
          {/* Active Progress Thread */}
          <motion.div 
            className="absolute top-7 left-0 h-[2px] -z-10"
            style={{ 
              marginLeft: '2.5rem',
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--info) 100%)'
            }}
            initial={false}
            animate={{ 
              width: `calc(${((currentStep - 1) / 3) * 100}% - 5rem)` 
            }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />

          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isClickable = true;

            return (
              <button
                key={step.number}
                onClick={() => onStepClick(step.number as Step)}
                className={`flex flex-col items-center gap-3 relative group ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                disabled={!isClickable}
              >
                <motion.div
                  className={`w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--info)] shadow-[var(--shadow-lg)]'
                      : isCompleted
                      ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--info)] opacity-60'
                      : 'bg-[var(--background-elevated)] border border-[var(--border)] shadow-[var(--shadow-xs)]'
                  }`}
                  whileHover={isClickable ? { scale: 1.05, y: -2 } : {}}
                  whileTap={isClickable ? { scale: 0.98 } : {}}
                  style={{
                    boxShadow: isActive ? '0 8px 24px var(--primary-glow)' : undefined
                  }}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isActive || isCompleted ? 'text-white' : 'text-[var(--foreground-subtle)]'
                    }`}
                  />
                </motion.div>
                <div className="text-center">
                  <div className={`text-[0.8125rem] font-medium whitespace-nowrap tracking-tight ${
                    isActive ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'
                  }`}>
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}