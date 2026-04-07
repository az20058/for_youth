/**
 * Node 22의 native fetch globals를 jsdom에 주입하는 커스텀 환경
 * MSW(msw/node)와 @testing-library/react 를 동시에 지원
 *
 * jsdom 기본 환경은 customExportConditions: ['browser']를 설정해서
 * msw/node가 null(browser export)로 해석되는 문제가 있음
 * → customExportConditions를 빈 배열로 재정의하여 node 조건으로 해석되도록 함
 */
import { TextDecoder, TextEncoder } from 'util';
import JSDOMEnvironment from 'jest-environment-jsdom';
import type { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';

export default class FixedJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(
      {
        ...config,
        projectConfig: {
          ...config.projectConfig,
          testEnvironmentOptions: {
            ...config.projectConfig.testEnvironmentOptions,
            customExportConditions: [],
          },
        },
      },
      context,
    );
  }

  async setup() {
    await super.setup();
    // jsdom은 fetch/encoding 관련 전역 변수를 구현하지 않음
    // Node 22 네이티브 globals를 jsdom window에 주입
    Object.assign(this.global, {
      TextDecoder,
      TextEncoder,
      fetch,
      Request,
      Response,
      Headers,
      FormData,
      ReadableStream,
      WritableStream,
      TransformStream,
      ReadableStreamDefaultReader,
      WritableStreamDefaultWriter,
      BroadcastChannel,
      Blob,
      File,
      crypto,
      structuredClone,
    });
  }
}
