
import * as crypto from 'crypto';

function createEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

console.log(createEncryptionKey())
