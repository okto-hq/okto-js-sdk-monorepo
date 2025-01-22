// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeJSON(obj: any, space?: string | number): string {
  return JSON.stringify(
    obj,
    (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value,
    space,
  );
}
