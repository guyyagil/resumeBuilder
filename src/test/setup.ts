class DOMMatrixMock {}
(globalThis as any).DOMMatrix = DOMMatrixMock;

import { expect } from 'vitest';
import '@thednp/dommatrix';

(globalThis as any).expect = expect;