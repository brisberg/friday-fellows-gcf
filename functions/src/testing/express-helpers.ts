/* istanbul ignore file */

export type MethodType = 'GET'|'POST'|'OPTIONS';

/**
 * Mocking utility which will mock Express requests used in the cloud functions
 */
export class MockRequest {
  method: MethodType = 'GET';
  headers: {[header: string]: string} = {};
  body: any = {};

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
  setBody(payload: any) {
    this.body = payload;
    return this;
  }
}

/**
 * Mocking utility which will mock Express responses used in the cloud
 * functions
 */
export class MockResponse {
  headers: {[header: string]: string} = {};
  body: any = {};
  statusCode: number = 200;

  setHeader(header: string, value: string) {
    this.headers[header] = value;
    return this;
  }
  getHeader(header: string) {
    return this.headers[header];
  }
  send(payload: any) {
    this.body = payload;
    return this;
  }
  status(stat: number) {
    this.statusCode = stat;
    return this;
  }
  // send(cb: (payload: any) => void) {
  //   cb(this.body);
  //   return this;
  // };
}
