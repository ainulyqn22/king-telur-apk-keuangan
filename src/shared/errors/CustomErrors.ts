export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BackupValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BackupValidationError';
  }
}

export class BackupRecoveryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BackupRecoveryError';
  }
}

export class BusinessRuleViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleViolation';
  }
}
