import './globals.css'

export const metadata = {
  title: 'Jain Stavan Platform',
  description: 'Listen to all Jain Stavans, Bhajans and Songs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}