import { useState } from 'react';
import { ApiError } from '../data/api';

/**
 * Sends a form and keeps the backend's answer: one message per field, the code of an error for the whole
 * form (for example `invalid_credentials`), or `failed` when the request did not get through.
 */
export function useSubmit() {
  const [working, setWorking] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [code, setCode] = useState<string>();
  async function run<T>(request: () => Promise<T>, done: (result: T) => void) {
    setWorking(true);
    setCode(undefined);
    setFields({});
    try {
      done(await request());
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) setFields(error.fields);
      else setCode(error instanceof ApiError ? error.code : 'network');
    } finally {
      setWorking(false);
    }
  }
  const failed = code !== undefined;
  return { working, fields, code, failed, setFields, run };
}
