class AggregateError<T extends Record<string, unknown>> extends Error {
  private _errors;

  name = 'AggregateError';

  // @ts-ignore
  constructor(errors: { error: Error; relatedQuery: T }[]) {
    let message = errors.map(({ error }) => {
      return typeof error.stack === 'string' ? error.stack : String(error);
    }).join('\n');

    message = `\n\n${message}`;

    super(message);

    this._errors = errors;
  }

  get errors() {
    return this._errors.slice();
  }
}

export = AggregateError;
