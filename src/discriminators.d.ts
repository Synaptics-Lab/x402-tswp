/**
 * @file discriminators.d.ts
 * Type definitions for canonical X402-TSWP Discriminator Registry and Validators.
 */

export type DiscriminatorTag =
  | 'X402G'
  | 'X402W'
  | 'X402M'
  | 'X402MR'
  | 'X402E'
  | 'X402B'
  | 'X402BN'
  | 'X402BR'
  | 'X402N'
  | 'X402L'
  | 'X402Z'
  | 'X402R';

export type EstateStatus =
  | 'LIVE_ONCHAIN'
  | 'LIVE_GATEWAY'
  | 'STANDARDS_TRACK';

export interface DiscriminatorRecord {
  tag: DiscriminatorTag;
  name: string;
  status: EstateStatus;
  syntax: string;
  regex: RegExp;
  rails: string[];
  service: string;
  description: string;
  liveExample: string | null;
}

export declare const DISCRIMINATOR_TAGS: Record<DiscriminatorTag, DiscriminatorTag>;
export declare const ESTATE_STATUS: Record<EstateStatus, EstateStatus>;
export declare const DISCRIMINATOR_REGISTRY: Record<DiscriminatorTag, DiscriminatorRecord>;

export interface ValidationResult {
  valid: boolean;
  tag?: DiscriminatorTag;
  record?: DiscriminatorRecord;
  error?: string;
}

export declare function validateTswpMemo(memo: string): ValidationResult;
export declare function buildGatewayMemo(challengeUuid: string): string;
export declare function buildLaneMemo(lane: number | string, window: number | string | bigint, nonce: number | string | bigint): string;
export declare function buildWindowMemo(window: number | string, participantSyn: string): string;
