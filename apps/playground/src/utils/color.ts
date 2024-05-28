function hashCode(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}

function getColorFromHash(hash: number) {
  const colors = ['#FFB6C1', '#6A5ACD', '#20B2AA', '#FF6347', '#4682B4', '#008080', '#FFD700']
  return colors[Math.abs(hash % colors.length)]
}

function getUserAvatarColor(str: string) {
  const hash = hashCode(str)
  const color = getColorFromHash(hash)
  return color
}

export { getUserAvatarColor }
