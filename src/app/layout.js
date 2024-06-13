import "@/app/global.css";

export const metadata = {
  title: "GAFFASHION - 3D Simulator",
  description: "Wallet Simulator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ overflow: "hidden" }}>{children}</body>
    </html>
  );
}
