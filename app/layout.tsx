import type { Metadata } from "next";
import { poppins } from '@/components/fonts';
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movement Metric",
  description: "Track your workouts and continue your progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={ `${ poppins.className }` }>
        <ClerkProvider
          localization={ {
            signIn: {
              start: {
                title: 'Sign in to Movement Metric',
                subtitle: 'Track your workouts and continue your progress',
                actionText: "Don't have an account?",
                actionLink: 'Create account',
              },
            },
          } }
        >
          { children }
        </ClerkProvider>
      </body>
    </html>
  );
}
