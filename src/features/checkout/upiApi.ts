export type CollectStatus = 'pending' | 'approved';

export interface UpiApi {
  /** Sends a collect request to the payer's UPI app. */
  sendCollect(vpa: string): Promise<{ requestId: string }>;
  /** Polled while the user approves in their UPI app. */
  checkStatus(requestId: string): Promise<CollectStatus>;
}

/** In-memory fake: approves after `approveAfterPolls` status checks. Records calls for tests. */
export function createFakeUpiApi(approveAfterPolls = 3) {
  let polls = 0;
  const calls: string[] = [];
  const api: UpiApi & { calls: string[] } = {
    calls,
    async sendCollect(vpa) {
      calls.push(`send:${vpa}`);
      polls = 0;
      return { requestId: `req-${calls.length}` };
    },
    async checkStatus(requestId) {
      calls.push(`check:${requestId}`);
      polls += 1;
      return polls >= approveAfterPolls ? 'approved' : 'pending';
    },
  };
  return api;
}

const VPA = /^[\w.-]{2,}@[a-z]{2,}$/i;
export const isValidVpa = (vpa: string) => VPA.test(vpa.trim());
