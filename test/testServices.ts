import axios from 'axios';

import type { Services } from '../src/app/services';
import { createMemoryStore } from '../src/core/storage/keyValueStore';
import { FakePostRepository } from './fakePostRepository';

/** Services for tests: no real network, in-memory storage, fake repositories. */
export function testServices(overrides: Partial<Services> = {}): Services {
  return {
    http: axios.create(),
    store: createMemoryStore(),
    postRepository: new FakePostRepository(),
    ...overrides,
  };
}
