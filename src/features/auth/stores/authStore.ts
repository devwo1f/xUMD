import { create } from 'zustand';

export type AuthStep = 'email' | 'otp' | 'loading';

interface AuthFlowStore {
  step: AuthStep;
  email: string;
  error: string | null;
  otpCooldownEnd: number | null;
  setStep: (step: AuthStep) => void;
  setEmail: (email: string) => void;
  setError: (error: string | null) => void;
  startCooldown: (seconds: number) => void;
  reset: () => void;
}

const initialState = {
  step: 'email' as AuthStep,
  email: '',
  error: null as string | null,
  otpCooldownEnd: null as number | null,
};

export const useAuthFlowStore = create<AuthFlowStore>((set) => ({
  ...initialState,
  setStep: (step) => set({ step, error: null }),
  setEmail: (email) => set({ email }),
  setError: (error) => set({ error }),
  startCooldown: (seconds) => set({ otpCooldownEnd: Date.now() + seconds * 1000 }),
  reset: () => set(initialState),
}));
