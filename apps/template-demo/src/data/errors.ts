/**
 * An error from the backend, ready for a form: a code for the whole request, and one message per field
 * when the backend rejects a value. The backend writes the messages; the form shows them under each field.
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}
