export type BaseErrorType = BaseError & { name: 'BaseError' };

type BaseErrorParameters = {
  name?: string | undefined;
  details?: string | undefined;
  metaMessages?: string[] | undefined;
};

export class BaseError extends Error {
  details: string;
  metaMessages?: string[] | undefined;
  shortMessage: string;

  override name = 'BaseError';

  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    const message = [shortMessage || 'An error occurred.', ''].join('\n');

    super(message);

    this.details = args.details ?? '';
    this.metaMessages = args.metaMessages;
    this.name = args.name ?? this.name;
    this.shortMessage = shortMessage;
  }
}
