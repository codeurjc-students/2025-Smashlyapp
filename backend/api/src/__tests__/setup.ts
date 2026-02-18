import { beforeAll, afterAll, afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
});

global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.afterEach = afterEach;
