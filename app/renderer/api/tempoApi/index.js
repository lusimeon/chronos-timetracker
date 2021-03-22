import config from 'config';

function apiFactory({ makeRequest }) {
  const apiCommonMethods = [
    ['getAllAccounts', '/accounts'],
    ['updateWorklog', '/worklogs/{worklogId}'],
  ];

  let headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.tempoAuthToken}`,
  };
  let rootApiUrl = config.tempoUrl;
  let baseApiUrl = '/core/3';
  let mockMethods = {};

  function fillUrlTemplate(
    template,
    templateVars,
  ) {
    const re = new RegExp('{', 'g');
    return (
      new Function( /* eslint-disable-line */
        `return \`${template.replace(re, '${this.')}\`;`,
      ).call(templateVars)
    );
  }

  function buildQueryUrl(
    params = {},
    endpointUrl,
    baseUrl,
  ) {
    const urlInstance = new URL(
      `${baseUrl}${fillUrlTemplate(endpointUrl, params)}`,
    );

    urlInstance.search = new URLSearchParams(params);
    return urlInstance.toString();
  }

  function performFetch({
    methodName,
    endpointUrl,
    baseUrl,
    method,
    params,
    body,
  }) {
    const url = buildQueryUrl(
      params,
      endpointUrl,
      `${rootApiUrl}${baseUrl}`,
    );

    if (mockMethods[methodName]) {
      return mockMethods[methodName]({
        ...params,
        url,
        endpointUrl,
      });
    }

    return makeRequest(
      url,
      {
        method,
        headers,
        ...(
          Object.keys(body).length
            ? ({
              body: JSON.stringify(body),
            })
            : {}
        ),
      },
    );
  }

  return ({
    setHeaders(newHeaders) {
      headers = newHeaders;
      return headers;
    },

    setBaseUrl(newBaseUrl, newRootUrl) {
      baseApiUrl = newBaseUrl;
      if (newRootUrl) {
        rootApiUrl = newRootUrl;
      }
      return baseApiUrl;
    },

    setRootUrl(url) {
      rootApiUrl = url;
    },

    setMockMethods(
      mockObject,
      merge = true,
    ) {
      mockMethods = merge ? {
        ...mockMethods,
        ...mockObject,
      } : mockObject;

      return mockMethods;
    },

    clearMockMethods() {
      mockMethods = {};
      return mockMethods;
    },

    setJWT(jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    },

    ...(
      apiCommonMethods.reduce((
        acc,
        [
          methodName,
          endpointUrl,
          method = 'GET',
          baseUrl,
        ],
      ) => ({
        ...acc,
        [methodName]({
          params = {},
          body = {},
        } = {
          params: {},
          body: {},
        }) {
          return performFetch({
            methodName,
            endpointUrl,
            baseUrl: baseUrl || baseApiUrl,
            method,
            params,
            body,
          });
        },
      }), {})
    ),
  });
}

export default apiFactory;
