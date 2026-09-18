import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tarifs'],
        disallow: ['/dashboard', '/api/', '/admin', '/register', '/login', '/beta'],
      },
    ],
    sitemap: 'https://talenth.fr/sitemap.xml',
  }
}
