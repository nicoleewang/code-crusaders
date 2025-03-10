import config from '../config/test.json';
import request from 'sync-request';
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 10000;

export const requestHelper = (
  method,
  path,
  payload,
  headers = {}
) => {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }
  const url = SERVER_URL + path;
  const res = request(method, url, { qs, json, headers, timeout: TIMEOUT_MS });
  return res;
};

export const orderFormCreateRequest = (jsonOrderForm) => {
  return requestHelper('POST', '/v1/order/create/form', jsonOrderForm );
}

// make ur wrapper functions here for user endpoints below!!!
// format the name of ur wrapper as <functionName>Request

export const orderFormUpdateRequest = (orderId, jsonOrderForm) => {
  return requestHelper('PUT', `/v1/order/${orderId}`, jsonOrderForm );
}

export const orderFormBulkRequest = (jsonOrderList) => {
  return requestHelper('POST', `/v1/order/create/bulk`, jsonOrderList);
}