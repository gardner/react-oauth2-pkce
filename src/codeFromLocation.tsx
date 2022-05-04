export const getCodeFromLocation = (location: Location): string => {
  const split = location.toString().split('?')
  if (split.length < 2) {
    return ''
  }
  const pairs = split[1].split('&')
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key === 'code') {
      return decodeURIComponent(value || '')
    }
  }
  return ''
}

export const removeCodeFromLocation = (location: Location): void => {
  const [base, search] = location.href.split('?')
  if (!search) {
    return
  }
  const newSearch = search
    .split('&')
    .map((param) => param.split('='))
    .filter(([key]) => key !== 'code')
    .map((keyAndVal) => keyAndVal.join('='))
    .join('&')
  window.history.replaceState(
    window.history.state,
    '',
    base + (newSearch.length ? `?${newSearch}` : '')
  )
}
