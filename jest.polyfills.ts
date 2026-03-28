// Jest jsdom 환경에서 MSW가 필요로 하는 Web API 글로벌 폴리필
// Node 18+에서는 fetch, Request, Response 등이 기본 내장되어 있음
// jsdom이 이 값들을 덮어쓰는 경우를 대비해 Node의 global에서 명시적으로 할당
/* eslint-disable @typescript-eslint/no-require-imports */
const { TextDecoder, TextEncoder } = require('util');

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  fetch: global.fetch,
  Request: global.Request,
  Response: global.Response,
  Headers: global.Headers,
  FormData: global.FormData,
});
