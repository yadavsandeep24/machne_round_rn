export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

/** Validates untrusted JSON. Throws TypeError, which safeCall maps to a parse error. */
export function parsePost(json: unknown): Post {
  const o = json as Record<string, unknown>;
  if (typeof o?.id !== 'number' || typeof o.title !== 'string') {
    throw new TypeError('Invalid post');
  }
  return {
    id: o.id,
    userId: typeof o.userId === 'number' ? o.userId : 0,
    title: o.title,
    body: typeof o.body === 'string' ? o.body : '',
  };
}
