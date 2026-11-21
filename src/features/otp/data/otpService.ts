export interface OtpChallenge {
  /** Absolute times (ms since epoch), so they survive restarts. */
  resendAvailableAt: number;
  expiresAt: number;
  resendsLeft: number;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attemptsLeft: number }
  | { ok: false; reason: 'expired' | 'locked' };

export interface OtpService {
  request(phone: string): Promise<OtpChallenge>;
  resend(phone: string): Promise<OtpChallenge>;
  verify(phone: string, code: string): Promise<VerifyResult>;
}

/**
 * Fake server for the demo and tests. The REAL rules (cooldown, expiry,
 * attempt limits) must be enforced server-side; the client only mirrors them
 * for UX. Demo code: 123456.
 */
export function createFakeOtpService({
  now = Date.now,
  cooldownSec = 30,
  ttlSec = 300,
  maxResends = 3,
  maxAttempts = 5,
  code = '123456',
} = {}): OtpService {
  let state = { resendsLeft: maxResends, attemptsLeft: maxAttempts, expiresAt: 0, resendAt: 0 };
  const issue = (): OtpChallenge => {
    state = { ...state, attemptsLeft: maxAttempts, expiresAt: now() + ttlSec * 1000, resendAt: now() + cooldownSec * 1000 };
    return { resendAvailableAt: state.resendAt, expiresAt: state.expiresAt, resendsLeft: state.resendsLeft };
  };
  return {
    request: async () => {
      state.resendsLeft = maxResends;
      return issue();
    },
    resend: async () => {
      if (now() < state.resendAt || state.resendsLeft <= 0) throw new Error('Too early or no resends left');
      state.resendsLeft -= 1;
      return issue();
    },
    verify: async (_phone, input) => {
      if (state.attemptsLeft <= 0) return { ok: false, reason: 'locked' };
      if (now() > state.expiresAt) return { ok: false, reason: 'expired' };
      if (input === code) return { ok: true };
      state.attemptsLeft -= 1;
      return state.attemptsLeft <= 0
        ? { ok: false, reason: 'locked' }
        : { ok: false, reason: 'wrong', attemptsLeft: state.attemptsLeft };
    },
  };
}
