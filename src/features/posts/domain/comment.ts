export interface Comment {
  id: number;
  name: string;
  email: string;
  body: string;
}

export function parseComment(json: unknown): Comment {
  const o = json as Record<string, unknown>;
  if (typeof o?.id !== 'number') throw new TypeError('Invalid comment');
  return {
    id: o.id,
    name: String(o.name ?? ''),
    email: String(o.email ?? ''),
    body: String(o.body ?? ''),
  };
}
