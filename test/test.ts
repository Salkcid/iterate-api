import fetch from 'node-fetch';
import iterateAPICreator from '../src/index';

!(async () => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const q = (obj: Record<string, string | number>) => {
    return Object.entries(obj)
      .reduce((acc, [key, value], index) => `${acc}${index ? '&' : ''}${key}=${value}`, '?');
  }
  type RequiredQuery = { _page: number; _limit: number; };
  type FullQuery = RequiredQuery & { _sort: string; _order: 'desc' | 'asc' };
  type APIEntry = { id: number; title: string; author: string; };

  const iterate = iterateAPICreator<RequiredQuery, FullQuery, APIEntry>({
    requiredQuery: { _page: 1, _limit: 2 },
    changeQuery: query => ({ ...query, _page: query._page + 1 }),
    fetchEntriesFromAPI: query => fetch(`http://localhost:3000/posts${q(query)}`).then(res => res.json()),
    // isEntriesEqual: (e1, e2) => e1.id === e2.id
    // shouldFinish: (query) => query._page > 1
  });

  const [result, error] = await iterate(null, (entry) => {
    return entry.id;
  });

  console.log('result =>', result);
  console.log('error =>', error);
})();
