export function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('blob:') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl
  }

  if (imageUrl.startsWith('/')) {
    return imageUrl
  }

  return `/${imageUrl}`
}