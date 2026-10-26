/**
 * Types of the INNO-TREC data API, generated from openapi.yaml by `npm run api:types`.
 * Import the named types below; `paths` and `operations` describe each request in full.
 */
import type { components, operations, paths } from './schema';

export type { components, operations, paths };

type S = components['schemas'];
export type Problem = S['Problem'];
export type Quantity = S['Quantity'];
export type Reading = S['Reading'];
export type EnergyRow = S['EnergyRow'];
export type EnergyReport = S['EnergyReport'];
export type Indicator = S['Indicator'];
export type SystemPerformance = S['SystemPerformance'];
export type PvPerformanceReport = S['PvPerformanceReport'];
export type SourceComparison = S['SourceComparison'];
export type QuantityCheck = S['QuantityCheck'];
export type SourceCheckReport = S['SourceCheckReport'];
export type AlertState = S['AlertState'];
export type Alert = S['Alert'];
export type Asset = S['Asset'];
export type RoleId = S['RoleId'];
export type Role = S['Role'];
export type User = S['User'];
export type Invitation = S['Invitation'];
export type UserChanges = S['UserChanges'];

export type EnergyPeriod = operations['getEnergyReport']['parameters']['query']['period'];
export type PerformancePeriod = operations['getPvPerformance']['parameters']['query']['period'];
