import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X, ShieldCheck, Globe, Activity, Bot, Zap, BrainCircuit } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "WELCOME TO THE ARENA",
    content: "TruthFlow is a decentralized battlefield. Here, Truth is the scarcest asset, and it must be discovered through financial conflict.",
    icon: <ShieldCheck size={64} className="text-brand-neon" />,
    color: "border-brand-neon"
  },
  {
    title: "THE VOID (NAVIGATION)",
    content: "The 3D universe represents the global market state. Drag to rotate, scroll to zoom. Each glowing star is a Real World Asset (RWA) under verification.",
    icon: <Globe size={64} className="text-blue-400" />,
    color: "border-blue-400"
  },
  {
    title: "READ THE SIGNAL",
    content: (
      <div className="space-y-2">
        <p>Analyze the glowing nodes:</p>
        <ul className="list-disc list-inside text-left pl-4 space-y-1 text-gray-400">
          <li><span className="text-brand-neon">GREEN</span> = High probability of Truth.</li>
          <li><span className="text-brand-danger">RED</span> = Suspected Fraud.</li>
          <li><span className="text-white">SIZE</span> = Total Liquidity staked.</li>
        </ul>
      </div>
    ),
    icon: <Activity size={64} className="text-brand-danger" />,
    color: "border-brand-danger"
  },
  {
    title: "BRAIN MINTING (THE ALPHA)",
    content: (
      <div className="space-y-2">
        <p className="font-bold text-white">How to make 100x Returns:</p>
        <p>Don't just bet—<span className="text-brand-neon">PROVE IT</span>. Upload unique evidence (satellite photos, documents).</p>
        <p>The AI Oracle scores your intel. <br/>High Score = <span className="text-green-400 font-bold">95% DISCOUNT</span> on token entry price.</p>
        <p className="text-xs text-gray-500 italic mt-2">"Information is the ultimate leverage."</p>
      </div>
    ),
    icon: <BrainCircuit size={64} className="text-pink-500" />,
    color: "border-pink-500"
  },
  {
    title: "AI vs HUMAN",
    content: "AI Agents constantly scan satellite & sensor data to price assets. Your job is to outsmart them. If an AI is hallucinating, bet against it to earn yields.",
    icon: <Bot size={64} className="text-purple-400" />,
    color: "border-purple-400"
  },
  {
    title: "INITIALIZE PROTOCOL",
    content: "You have been allocated 5,000 HSK (Testnet). Enter the markets, upload evidence, and extract value from the truth.",
    icon: <Zap size={64} className="text-yellow-400" />,
    color: "border-yellow-400"
  }
];

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepData = STEPS[currentStep];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Cyberpunk Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-neon to-transparent opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

      <div className={`relative w-full max-w-lg bg-scifi-bg border-2 ${stepData.color} shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg p-1 overflow-hidden transition-colors duration-500`}>
        
        {/* Inner Container */}
        <div className="bg-black/80 p-8 h-full flex flex-col items-center text-center relative">
          
          {/* Skip Button */}
          <button 
            onClick={onComplete}
            className="absolute top-4 right-4 text-xs font-mono text-gray-500 hover:text-white uppercase tracking-widest border border-transparent hover:border-gray-700 px-2 py-1 rounded transition-all"
          >
            Skip Sequence
          </button>

          {/* Progress Bar */}
          <div className="w-full flex gap-1 mb-8">
            {STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx <= currentStep ? 'bg-white shadow-[0_0_10px_white]' : 'bg-gray-800'}`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-6 animate-pulse-slow">
            {stepData.icon}
          </div>

          <h2 className="text-2xl font-bold font-mono text-white mb-4 tracking-tighter uppercase">
            {stepData.title}
          </h2>

          <div className="text-gray-300 font-sans leading-relaxed mb-8 min-h-[100px] flex flex-col justify-center">
            {stepData.content}
          </div>

          {/* Controls */}
          <div className="flex w-full justify-between items-center mt-auto">
            <button 
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 text-sm font-mono uppercase tracking-wider ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white'}`}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <button 
              onClick={handleNext}
              className="bg-white text-black hover:bg-brand-neon transition-colors font-bold py-2 px-6 rounded flex items-center gap-2 uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {currentStep === STEPS.length - 1 ? 'Enter Void' : 'Next'}
              {currentStep !== STEPS.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
