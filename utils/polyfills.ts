import { Buffer } from 'buffer';

if (typeof global !== 'undefined') {
  global.Buffer = global.Buffer || Buffer;
}
