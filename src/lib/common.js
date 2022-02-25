export function valueAsArray (v) {
  if (!v) {
    v = []
    return v
  }

  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch (e) {
      v = []
    }
  }

  if (typeof v === 'object') {
    if (!Array.isArray(v)) {
      v = Object.values(v)
    }
  } else {
    v = [v]
  }

  return v
}

export function setArr (vm, vueProp, key, values) {
  if (!Array.isArray(values)) {
    values = Object.values(values)
  }

  vm.$set(vueProp, key, values)
}

export function setObj (vm, o, values, extra = {}, whitelist = null) {
  const l_values = { ...extra, ...values }
  for (const i in l_values) {
    if (whitelist === null || whitelist.includes(i)) {
      // eslint-disable-next-line no-prototype-builtins
      if (l_values.hasOwnProperty(i)) {
        vm.$set(o, i, l_values[i])
      }
    }
  }
}

export function clearObj (o) {
  for (const i in o) {
    // eslint-disable-next-line no-prototype-builtins
    if (o.hasOwnProperty(i)) {
      vm.$set(o, i, null)
      delete o[i]
    }
  }
}
