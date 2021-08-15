import AggregateError from './AggregateError';

type DUESuccess<T> = {
  success: true;
  data: T;
}

type DUEFailure<T> = {
  success: false;
  reason: T;
}

export type IterateAPICreatorParams<RequiredQuery, FullQuery, APIEntry> = {
  /** The minimum required query for the iteration to work. */
  requiredQuery: RequiredQuery;
  /** A function that somehow retrieves and returns the entries (records) you need. */
  fetchEntriesFromAPI: (query: Partial<FullQuery>) => Promise<APIEntry[]>;
  /** A function that changes the query object in order to get the next batch of entries.
   * Called after each *fetchEntriesFromAPI* call. */
  changeQuery: (query: RequiredQuery & Partial<FullQuery>) => RequiredQuery & Partial<FullQuery>;
  /** A function that knows the equality condition of two entries (records).
   * If skipped, duplicate entries are possible. */
  isEntriesEqual?: (entry1: APIEntry, entry2: APIEntry) => boolean;
  /** A function that could entirely stop iteration based on changed query.
   * Called after each *changeQuery* call. */
  shouldFinish?: (query: RequiredQuery & Partial<FullQuery>) => boolean;
}

export type Flow = {
  /** When returned from mapper function, skips inclusion of current entry in resulting array. */
  skip: Symbol;
  /** When returned from mapper function, prematurely finishes iteration over API. */
  finish: Symbol;
}

type MapperReturnType<T> = Promise<T> | T;
export type Mapper<A, T> = (entry: A, previousEntries: T[], flow: Flow) => MapperReturnType<T | Symbol>;

export default function iterateAPICreator<
  RequiredQuery extends Partial<FullQuery>,
  FullQuery extends RequiredQuery,
  APIEntry,
>(creatorParams: IterateAPICreatorParams<RequiredQuery, FullQuery, APIEntry>) {
  return async function iterateAPI<TransformedEntry>(
    additionalQueryParams: Partial<FullQuery> | null,
    mapper: Mapper<APIEntry, TransformedEntry>,
  ): Promise<[TransformedEntry[], AggregateError<RequiredQuery & Partial<FullQuery>> | undefined]> {
    const {
      requiredQuery,
      fetchEntriesFromAPI,
      isEntriesEqual,
      changeQuery,
      shouldFinish,
    } = creatorParams;

    const flow: Flow = {
      skip: Symbol('skip'),
      finish: Symbol('finish'),
    };

    let query: RequiredQuery & Partial<FullQuery> = {
      ...requiredQuery,
      ...(additionalQueryParams as Partial<FullQuery>),
    };

    const prevEntries: APIEntry[] = [];
    const transformedEntries: TransformedEntry[] = [];
    const errors: { error: Error; relatedQuery: typeof query }[] = [];

    async function handleSuccessfulFetch(entries: APIEntry[]): Promise<Symbol | void> {
      if (!entries.length) {
        return flow.finish;
      }

      for (const entry of entries) {
        const entryIsAlreadyFetched = isEntriesEqual
          ? prevEntries.find(prev => isEntriesEqual(entry, prev))
          : undefined;

        if (entryIsAlreadyFetched) {
          continue;
        }

        const mapperResult = await mapper(entry, transformedEntries, { ...flow });

        if (mapperResult === flow.finish) {
          return flow.finish;
        }

        if (mapperResult === flow.skip) {
          continue;
        }

        transformedEntries.push(mapperResult as TransformedEntry);
      }

      prevEntries.push(...entries);
    }

    function getError(): AggregateError<typeof query> | undefined {
      return errors.length ? new AggregateError(errors) : undefined;
    }

    while (!shouldFinish?.(query)) {
      const fetchResult = await fetchEntriesFromAPI(query)
        .then<DUESuccess<APIEntry[]>>(e => ({ success: true, data: e }))
        .catch<DUEFailure<Error>>(error => ({ success: false, reason: error }));

      if (fetchResult.success) {
        const should = await handleSuccessfulFetch(fetchResult.data);
        if (should === flow.finish) {
          return [transformedEntries, getError()];
        }
      } else {
        errors.push({ error: fetchResult.reason, relatedQuery: { ...query } })
      }

      query = changeQuery(query);
    }

    return [transformedEntries, getError()];
  };
}
