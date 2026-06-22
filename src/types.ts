export type HostTarget = 'openclaw' | 'claude-plugin';

export interface SkillManifest {
  name: string;
  title?: string;
  description: string;
  version: string;
  activation: {
    globs?: string[];
    keywords?: string[];
    examples: string[];
    antiExamples?: string[];
  };
  hosts: HostTarget[];
  files: string[];
  safety: {
    externalWrites: 'forbidden' | 'ask-first' | 'allowed';
    notes: string[];
  };
  verification: string[];
}

export interface Diagnostic {
  level: 'error' | 'warning';
  code: string;
  message: string;
  file?: string;
}

export interface ActivationFixture {
  prompt: string;
  shouldActivate: boolean;
  reason?: string;
}

export interface ActivationResult extends ActivationFixture {
  actual: boolean;
  matched: string[];
  blockedBy: string[];
}
