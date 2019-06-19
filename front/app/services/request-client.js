function getJWT(itemName) {
  return localStorage.getItem(itemName)
}
const beforeSend = function(xhr, settings) {
  const jwt = getJWT('automan_jwt');
  xhr.setRequestHeader("Authorization", `JWT ${jwt}`);
}
let requests = [];
let pageQueries = [];
const abortXhr = (xhr) => {
  const idx = requests.indexOf(xhr);
  if (idx < 0) { return; }
  xhr.abort();
  requests.splice(idx, 0);
};
class PageQuery {
  constructor() {
    this.page = 1;
    this.perPage = 10;
    this.searchText = null;
    this.sortKey = 'id';
    this.sortReverseFlag = false;
    pageQueries.push(this);
    this.xhr = null;
  }
  setRequest(xhr) {
    this.xhr = xhr;
  }
  abort() {
    if (this.xhr === null) { return; }
    abortXhr(this.xhr);
    this.xhr = null;
  }
  getPage() { return this.page; }
  setPage(page) { this.page = Math.max(1, page); }
  getPerPage() { return this.perPage; }
  setPerPage(pp) { this.perPage= Math.max(1, pp); }
  getSearch() { return this.searchText; }
  setSearch(query) { this.searchText = query==null ? null : query.toString(); }
  getSortKey() { return this.sortKey; }
  setSortKey(key) { this.sortKey = key==null ? null : key.toString(); }
  getSortRevFlag() { return this.sortReverseFlag; }
  setSortRevFlag(flag) { this.sortReverseFlag = !!flag; }

  getData() {
    const data = {
      page:   this.getPage(),
      per_page: this.getPerPage()
    };
    let sort_key   = this.getSortKey(),
      reverse_flag = this.getSortRevFlag(),
      search     = this.getSearch();
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

const createErrorMessage = function(xhr) {
  var code = xhr.status;
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
const request = (url, data, method, successCB, failCB, options) => {
  if (typeof(failCB) !== 'function') { failCB = function() { }; }
  if (typeof(successCB) !== 'function') { successCB = function() { }; }

  let pageQuery = null;
  if (data instanceof PageQuery){
    pageQuery = data;
    pageQuery.abort();
    data = pageQuery.getData();
  } else if (method == 'POST' || method == 'PUT') {
    data = JSON.stringify(data)
  }

  let ret;
  const originalOptions = {
    url: url,
    type: method,
    data: data,
    contentType: 'application/json',
    cache: false,
    timeout: 20000,
    success: (res, status, xhr) => {
      switch(xhr.status) {
      case 200:
      case 201:
        successCB(res);
        break;
      case 204:
        successCB(null);
        break;
      default:
        const mes = {
          message: createErrorMessage(xhr),
          code: xhr.status
        };
        failCB(mes);
      }
    },
    error: (xhr, type, err) => {
      const mes = {
        message: createErrorMessage(xhr),
        code: xhr.status,
        info: {
          type: type,
          err: err
        }
      };
      failCB(mes);
    },
    complete: () => {
      if ( pageQuery ) {
        pageQuery.abort();
      } else {
        abortXhr(ret);
      }
    }
  };
  originalOptions.beforeSend = beforeSend;
  if (method === 'GET') {
    originalOptions.dataType = 'json';
  } else {
    originalOptions.dataType = 'text';
  }

  ret = $.ajax(Object.assign({}, originalOptions , options));
  if ( pageQuery ) {
    pageQuery.setRequest(ret);
  }
  requests.push(ret);
  return ret;
}
const RequestClient = {
  createPageQuery: function(){
    return new PageQuery();
  },
  ajax: function(url, data, type, successCB, failCB, opt) {
    return request(url, data, type.toUpperCase(), successCB, failCB, opt);
  },
  get: function(url, data, successCB, failCB, opt) {
    return request(url, data, 'GET', successCB, failCB, opt);
  },
  post: function(url, data, successCB, failCB, opt) {
    return request(url, data, 'POST', successCB, failCB, opt);
  },
  put: function(url, data, successCB, failCB, opt) {
    return request(url, data, 'PUT', successCB, failCB, opt);
  },
  delete: function(url, data, successCB, failCB, opt) {
    return request(url, data, 'DELETE', successCB, failCB, opt);
  },
  getBinaryAsURL: function(url, successCB, failCB) {
    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const blob = xhr.response;
      successCB(URL.createObjectURL(blob));
    };
    xhr.open('GET', url);
    beforeSend(xhr);
    xhr.responseType = 'blob';
    xhr.send();
  },
  abortAll: function() {
    requests.forEach((xhr) => {
      xhr.abort();
    });
    requests = [];
    pageQueries = [];
  }
};

export default RequestClient;
