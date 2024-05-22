function hashCode(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
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
// type RGBColor = [number, number, number]

// function luminance(r: number, g: number, b: number): number {
//   const a: number[] = [r, g, b].map((v: number) => {
//     v /= 255
//     return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
//   })
//   return a[0]! * 0.2126 + a[1]! * 0.7152 + a[2]! * 0.0722
// }

// function parseHexColor(hex: string): RGBColor {
//   // Extracts RGB from hex color
//   const rgb: RGBColor = hex.match(/\w\w/g)?.map(hex => parseInt(hex, 16)) as RGBColor
//   return rgb
// }

// function getRandomColor(baseColor: string): string {
//   const rgb: RGBColor = parseHexColor(baseColor)
//   const baseLuminance: number = luminance(rgb[0], rgb[1], rgb[2])
//   let randomColor: string | undefined

//   do {
//     const r: number = Math.floor(Math.random() * 256)
//     const g: number = Math.floor(Math.random() * 256)
//     const b: number = Math.floor(Math.random() * 256)
//     const contrastLuminance: number = luminance(r, g, b)

//     // Check if the contrast is sufficient (> 0.5 difference in luminance)
//     if (Math.abs(baseLuminance - contrastLuminance) > 0.5) {
//       randomColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
//     }
//   } while (!randomColor)

//   return randomColor!
// }

// function getContrastingTextColor(backgroundColor: string): string {
//   const rgb: RGBColor = parseHexColor(backgroundColor)
//   const luminanceValue: number = luminance(rgb[0], rgb[1], rgb[2])

//   return luminanceValue > 0.5 ? '#333' : '#fff'
// }

// export { getRandomColor, getContrastingTextColor }
