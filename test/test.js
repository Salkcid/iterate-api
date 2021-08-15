const fetch = require('node-fetch');
const iterateAPICreator = require('../dist/index');

!(async () => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const q = (obj) => {
    return Object.entries(obj)
      .reduce((acc, [key, value], index) => `${acc}${index ? '&' : ''}${key}=${value}`, '?');
  }
  const iterate = iterateAPICreator({
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
