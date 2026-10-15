import { createContext, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DeveloperProfile, HybridApp } from '../../types/mini-app';

export const DeveloperProfileContext = createContext<DeveloperProfile | undefined>(undefined);
export function useDeveloperProfile() { const profile = useContext(DeveloperProfileContext); if (!profile) throw new Error('Developer profile is unavailable'); return profile; }
export function useDeveloperApp() { return useOutletContext<HybridApp>(); }
