export const toSnakeCase = (str: string): string => {
  return str
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase()
}

export const toUrlEncoded = (obj: {}): string => {
  return Object.keys(obj)
    .map(
      (k) =>
        encodeURIComponent(toSnakeCase(k)) + '=' + encodeURIComponent(obj[k])
    )
    .join('&')
}
