import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for SEO and social sharing
export const metadata = {
  title:{

    template:'%s / Full-Stack Code Practice - Next.js & FastAPI',
    default: 'Welcome / Full-Stack Code Practice - Next.js & FastAPI',

  } ,
  description: 'Practice and test your JavaScript, React, and Python/FastAPI knowledge with interactive code snippets and instant feedback.',
  keywords: ['React', 'Next.js', 'FastAPI', 'Python', 'Code Quiz', 'Full Stack Development'],
  openGraph: {
    title: 'Full-Stack Code Practice Platform',
    description: 'Interactive coding challenges using a Next.js frontend and a PostgreSQL-backed FastAPI backend.',
    url: 'http://localhost:3001', 
    siteName: 'Code Practice Platform',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
