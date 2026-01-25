import React, { useState } from 'react';
import { RedBlueChallenge } from './RedBlueChallenge';

interface TabContentProps {
  tab: 'DEFEND' | 'ATTACK';
  marketId: number;
}

export const TabContent: React.FC<TabContentProps> = ({ tab, marketId }) => {
  const [challenges, setChallenges] = useState<any[]>([]);
  
  const handleAddChallenge = (challenge: any) => {
    setChallenges([challenge, ...challenges]);
  };

  return (
    <div className="flex-1 overflow-y-auto max-h-[300px] mb-4 scrollbar-thin">
      <RedBlueChallenge 
        marketId={marketId} 
        side={tab === 'DEFEND' ? 'blue' : 'red'} 
        challenges={challenges}
        onAddChallenge={handleAddChallenge}
      />
    </div>
  );
};
