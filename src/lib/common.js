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
