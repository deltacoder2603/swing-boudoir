import React, { createContext, useContext, useState, useEffect } from 'react';

interface JoinedCompetition {
  id: string;
  name: string;
  slug: string;
  prizePool: number;
  endDate: string;
  joinedAt: string;
  coverImage?: string;
}

interface JoinedCompetitionsContextType {
  joinedCompetitions: JoinedCompetition[];
  joinCompetition: (competition: Omit<JoinedCompetition, 'joinedAt'>) => void;
  leaveCompetition: (competitionId: string) => void;
  isJoined: (competitionId: string) => boolean;
}

const JoinedCompetitionsContext = createContext<JoinedCompetitionsContextType | undefined>(undefined);

export const useJoinedCompetitions = () => {
  const context = useContext(JoinedCompetitionsContext);
  if (!context) {
    throw new Error('useJoinedCompetitions must be used within a JoinedCompetitionsProvider');
  }
  return context;
};

export const JoinedCompetitionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [joinedCompetitions, setJoinedCompetitions] = useState<JoinedCompetition[]>([]);

  // Load joined competitions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('joined-competitions');
    if (stored) {
      try {
        setJoinedCompetitions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse joined competitions from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage whenever joined competitions change
  useEffect(() => {
    localStorage.setItem('joined-competitions', JSON.stringify(joinedCompetitions));
  }, [joinedCompetitions]);

  const joinCompetition = (competition: Omit<JoinedCompetition, 'joinedAt'>) => {
    const newJoinedCompetition: JoinedCompetition = {
      ...competition,
      joinedAt: new Date().toISOString(),
    };

    setJoinedCompetitions(prev => {
      // Check if already joined
      if (prev.some(comp => comp.id === competition.id)) {
        return prev;
      }
      return [...prev, newJoinedCompetition];
    });
  };

  const leaveCompetition = (competitionId: string) => {
    setJoinedCompetitions(prev => prev.filter(comp => comp.id !== competitionId));
  };

  const isJoined = (competitionId: string) => {
    return joinedCompetitions.some(comp => comp.id === competitionId);
  };

  return (
    <JoinedCompetitionsContext.Provider
      value={{
        joinedCompetitions,
        joinCompetition,
        leaveCompetition,
        isJoined,
      }}
    >
      {children}
    </JoinedCompetitionsContext.Provider>
  );
};
