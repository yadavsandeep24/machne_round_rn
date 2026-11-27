import { createContext, useContext, type ReactNode } from 'react';

import type { Services } from './services';

const ServicesContext = createContext<Services | null>(null);

/** Gives screens the same Services the Redux thunks get, so tests inject fakes in one place. */
export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext value={services}>{children}</ServicesContext>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>');
  return services;
}
