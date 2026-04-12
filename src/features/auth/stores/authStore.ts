import { create } from 'zustand';

export type AuthStep = 'email' | 'otp' | 'loading';
export type AuthVisibleStep = Exclude<AuthStep, 'loading'>;

interface AuthFlowStore {
  step: AuthStep;
  loadingStep: AuthVisibleStep;
  email: string;
  error: string | null;
  otpCooldownEnd: number | null;
  setStep: (step: AuthStep) => void;
  beginLoading: (step: AuthVisibleStep) => void;
  setEmail: (email: string) => void;
  setError: (error: string | null) => void;
  startCooldown: (seconds: number) => void;
  reset: () => void;
}

const initialState = {
  step: 'email' as AuthStep,
  loadingStep: 'email' as AuthVisibleStep,
  email: '',
  error: null as string | null,
  otpCooldownEnd: null as number | null,
};

export const useAuthFlowStore = create<AuthFlowStore>((set) => ({
  ...initialState,
  setStep: (step) =>
    set((state) => ({
      step,
      loadingStep: step === 'loading' ? state.loadingStep : step,
      error: null,
    })),
  beginLoading: (step) => set({ step: 'loading', loadingStep: step, error: null }),
  setEmail: (email) => set({ email }),
  setError: (error) => set({ error }),
  startCooldown: (seconds) => set({ otpCooldownEnd: Date.now() + seconds * 1000 }),
  reset: () => set(initialState),
}));
