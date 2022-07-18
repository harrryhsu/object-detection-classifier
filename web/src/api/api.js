function http(method = "GET", url = "", data = null, isStream = false) {
  const controller = new AbortController();
  const signal = controller.signal;

  var option = {
    method: method,
    mode: "cors",
    cache: "no-cache",
    credentials: "omit",
    headers: {
      "Content-Type": isStream
        ? "application/x-www-form-urlencoded"
        : "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    signal,
  };

  if (data !== null) {
    if (data instanceof FormData) {
      option.body = data;
      delete option.headers;
    } else {
      option.body = JSON.stringify(data);
    }
  }

  var abort = false;
  const request = fetch(url, option).catch((err) => {
    if (err.name == "AbortError") abort = true;
    else throw err;
  });

  const wrapper = (request) => ({
    request,
    abort: () => controller.abort(),
    then: (callback) =>
      wrapper(request.then((rest) => !abort && callback(rest))),
    onabort: (callback) =>
      wrapper(request.finally((rest) => abort && callback(rest))),
    catch: (callback) =>
      wrapper(request.catch((rest) => !abort && callback(rest))),
  });

  return wrapper(request);
}

function jsonUnwrap(req) {
  return req
    .then((res) => res.json().then((data) => ({ data, status: res.status })))
    .then(({ data, status }) => {
      if (data.hasOwnProperty("streams")) return data;
      if (!data.status || status != 200) throw data;
      return data?.data;
    });
}

function buildQuery(query) {
  if (!query) return "";
  const params = new URLSearchParams(query);
  return params.toString();
}

export const ApiWrapper = () => {
  const id = window.location.pathname.split("/").last();
  const baseUrl =
    process.env.NODE_ENV === "development" ? "http://localhost:1000" : "";

  function get(path, body) {
    return jsonUnwrap(http("GET", `${baseUrl}/api/${path}`, body, false));
  }

  function post(path, body) {
    return jsonUnwrap(http("POST", `${baseUrl}/api/${path}`, body, false));
  }

  function put(path, body) {
    return jsonUnwrap(http("PUT", `${baseUrl}/api/${path}`, body, false));
  }

  function del(path, body) {
    return jsonUnwrap(http("DELETE", `${baseUrl}/api/${path}`, body, false));
  }

  return {
    GetMetadata: () => get("metadata"),
    GetList: () => get(`list?${buildQuery({ id })}`),
    GetImageSrc: (imagePath) =>
      `${baseUrl}/api/image?${buildQuery({ id, imagePath })}`,
    Submit: (body) => post("submit", { ...body, id }),
    Ignore: (body) => post("ignore", { ...body, id }),
  };
};
