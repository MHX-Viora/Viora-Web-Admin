import { useOutletContext } from 'react-router-dom';
import type { DeveloperProfile, HybridApp } from '../../types/mini-app';

export function useDeveloperProfile() { return useOutletContext<DeveloperProfile>(); }
export function useDeveloperApp() { return useOutletContext<HybridApp>(); }
