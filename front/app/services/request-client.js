const CURRENT_DOMAIN = location.hostname;
const createURLObj = url => {
  return new URL(url, location.href);
};
const addJWT = (urlObj, headers) => {
  if (urlObj.hostname !== CURRENT_DOMAIN) {
    return;
  }
  const jwt = localStorage.getItem('automan_jwt');
  headers.append('Authorization', `JWT ${jwt}`);
};

let abortableRequests = new Set();
class PageQuery {
  constructor() {
    this.page = 1;
    this.perPage = 10;
    this.searchText = null;
    this.sortKey = 'id';
    this.sortReverseFlag = false;
    this.xhr = null;
  }
  abort() {
    if (this.xhr === null) {
      return;
    }
    this.xhr.abort();
    this.xhr = null;
    abortableRequests.delete(this);
  }
  getPage() { return this.page; }
  setPage(page) { this.page = Math.max(1, page); }
  getPerPage() { return this.perPage; }
  setPerPage(pp) { this.perPage = Math.max(1, pp); }
  getSearch() { return this.searchText; }
  setSearch(query) { this.searchText = query == null ? null : query.toString(); }
  getSortKey() { return this.sortKey; }
  setSortKey(key) { this.sortKey = key == null ? null : key.toString(); }
  getSortRevFlag() { return this.sortReverseFlag; }
  setSortRevFlag(flag) { this.sortReverseFlag = !!flag; }

  getData(xhr) {
    if (xhr == null) {
      return this;
    }
    this.abort();
    this.xhr = xhr;
    abortableRequests.add(this);

    const data = {
      page: this.getPage(),
      per_page: this.getPerPage()
    };
    let sort_key = this.getSortKey(),
      reverse_flag = this.getSortRevFlag(),
      search = this.getSearch();
    if (sort_key !== null) {
      data.sort_key = sort_key;
      data.reverse_flag = reverse_flag;
    }
    if (search !== null) {
      data.search = search;
    }
    return data;
  }
}

const createErrorMessage = code => {
  if (200 <= code && code < 300) {
    return 'Server response type error';
  } else if (code === 400) {
    return 'Bad request';
  } else if (code === 401) {
    location.href = '/accounts/login/';
    return 'Unauthorized';
  } else if (code === 403) {
    return 'Permission denied';
  } else if (code === 404) {
    return 'Object does not exist';
  } else if (code === 405) {
    return 'Method not allowed';
  } else if (code === 500 || code === 501) {
    return 'Internal server error';
  } else if (501 < code && code < 600) {
    return 'Nework error';
  }
  return 'Unknown error';
};
const expandData = (urlObj, options, data) => {
  if (data == null) { return null; }

  if (data instanceof PageQuery) {
    data = data.getData(options.xhr);
  } else {
    abortableRequests.add(options.xhr);
  }

  if (options.method == 'GET') {
    const urlSearch = urlObj.searchParams;
    for (let key in data) {
      urlSearch.append(key, data[key]);
    }
  } else {
    if (data instanceof FormData) {
      return data;
    } else if (data instanceof Blob) {
      options.headers.set(
        'Content-Type', 'application/octet-stream'
      );
      return data;
    } else {
      options.headers.set(
        'Content-Type', 'application/json'
      );
      return JSON.stringify(data);
    }
  }
  return null;
};
const expandHeaders = (xhr, headers) => {
  for (let [key, value] of headers) {
    xhr.setRequestHeader(key, value);
  }
};

const applyOptions = (xhr, options) => {
  if (typeof options.timeout === 'number') {
    xhr.timeout = options.timeout;
  }
};

const getOptionFromArgs = (successCB, failCB, options) => {
  if (options != null) {
    return options;
  }
  if (failCB != null) {
    if (typeof failCB === 'object') {
      return failCB;
    }
    return null;
  }
  if (successCB != null) {
    if (typeof successCB === 'object') {
      return successCB;
    }
    return null;
  }
  return null;
};
const getHandleProgress = options => {
  if (options.handleProgress == null) {
    return null;
  }
  if (typeof options.handleProgress === 'function') {
    return options.handleProgress;
  }
  return null;
};
const request = (url, data, method, successCB, failCB, options) => {
  const urlObj = createURLObj(url);

  const opt = {
    method: method
  };

  const argOpt = getOptionFromArgs(successCB, failCB, options);
  const realOptions = Object.assign({}, opt, argOpt);
  const xhr = new XMLHttpRequest();
  realOptions.xhr = xhr;

  realOptions.headers = new Headers();
  addJWT(urlObj, realOptions.headers);

  const body = expandData(urlObj, realOptions, data);

  const handleProgress = getHandleProgress(realOptions);

  xhr.open(realOptions.method, urlObj.toString());

  expandHeaders(xhr, realOptions.headers);

  applyOptions(xhr, realOptions);

  let ret = new Promise((resolve, reject) => {
    try {
      if (xhr.upload && handleProgress) {
        xhr.upload.addEventListener('progress', e => {
          handleProgress(e);
        });
      }
      xhr.addEventListener('load', () => {
        abortableRequests.delete(xhr);

        const code = xhr.status;
        if (code === 200 || code === 201) {
          if (xhr.getResponseHeader('Content-Type') === 'application/json') {
            resolve(JSON.parse(xhr.response));
            return;
          }
          resolve(xhr.response);
          return;
        }
        if (code === 204) {
          resolve(null);
          return;
        }

        return reject({
          message: createErrorMessage(code),
          code: code
        });
      });
      xhr.send(body);
    } catch (err) {
      reject({
        message: err.toString()
      });
    }
  });


  if (typeof successCB === 'function') {
    ret = ret.then(successCB);
  }
  if (typeof failCB === 'function') {
    ret = ret.catch(failCB);
  }
  return ret;
}
const RequestClient = {
  createPageQuery: () => {
    return new PageQuery();
  },
  ajax: (url, data, type, successCB, failCB, opt) => {
    return request(url, data, type.toUpperCase(), successCB, failCB, opt);
  },
  get: (url, data, successCB, failCB, opt) => {
    return request(url, data, 'GET', successCB, failCB, opt);
  },
  post: (url, data, successCB, failCB, opt) => {
    return request(url, data, 'POST', successCB, failCB, opt);
  },
  put: (url, data, successCB, failCB, opt) => {
    return request(url, data, 'PUT', successCB, failCB, opt);
  },
  delete: (url, data, successCB, failCB, opt) => {
    return request(url, data, 'DELETE', successCB, failCB, opt);
  },
  getBinaryAsURL: (url, successCB, failCB) => {
    const urlObj = createURLObj(url);

    const headers = new Headers();
    addJWT(urlObj, headers);

    const options = {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      cache: "no-cache",
    };
    let ret = fetch(urlObj.toString(), options)
      .then(res => res.blob())
      .then(blob => URL.createObjectURL(blob));

    if (typeof successCB === 'function') {
      ret = ret.then(successCB);
    }
    if (typeof failCB === 'function') {
      ret = ret.catch(failCB);
    }

    return ret;
  },
  abortAll: () => {
    for (let req of abortableRequests) {
      req.abort();
    }
    abortableRequests = new Set();
  }
};

export default RequestClient;

