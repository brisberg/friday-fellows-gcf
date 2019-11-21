/* istanbul ignore file */

export type MethodType = 'GET'|'POST'|'OPTIONS';

/**
 * Mocking utility which will mock Express requests used in the cloud functions
 */
export class MockRequest<T> {
  method: MethodType = 'GET';
  headers: {[header: string]: string} = {};
  body?: T = {} as T;  // TODO: Convenient but might not be safe in all cases

  setMethod(method: MethodType) {
    this.method = method;
    return this;
  }
  setHeader(header: string, value: string) {
    this.headers[header] = value;
    return this;
  }
  getHeader(header: string) {
    return this.headers[header];
  }
  setBody(payload: T) {
    this.body = payload;
    return this;
  }
}

/**
 * Mocking utility which will mock Express responses used in the cloud
 * functions
 */
export class MockResponse<T> {
  headers: {[header: string]: string} = {};
  body?: T;
  statusCode: number = 200;

  setHeader(header: string, value: string) {
    this.headers[header] = value;
    return this;
  }
  getHeader(header: string) {
    return this.headers[header];
  }
  send(payload: T) {
    this.body = payload;
    return this;
  }
  status(stat: number) {
    this.statusCode = stat;
    return this;
  }
}
