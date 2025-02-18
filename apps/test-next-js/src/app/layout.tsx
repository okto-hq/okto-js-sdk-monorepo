"use client";

import { OktoProvider } from "@okto_web3/react-sdk";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <OktoProvider
          config={{
            environment: "sandbox",
            clientPrivateKey: "0xa",
            clientSWA: "0x6",
          }}
        >
          {children}
        </OktoProvider>
      </body>
    </html>
  );
}
