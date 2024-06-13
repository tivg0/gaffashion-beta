"use client";
import Head from "next/head";
import ThreeDViewer from "./components/ThreeDViewer";
import { useState } from "react";
import NextImage from "next/image";
import styles from "../styles/page.module.css";
import logo from "../imgs/logoGaffashion.png";
import logoStep from "../../public/logoStepNew.png";

const Home = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ overflowX: "hidden", overflowY: "hidden", width: "100%" }}>
      <Head>
        <title>3D Sweat Design Simulator</title>
        <meta name="description" content="Your 3D Sweat Design Simulator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.titleZone}>
        <div className={styles.titleStruct}>
          {window.innerWidth > 750 ? (
            <NextImage src={logo} width={236} height={35} />
          ) : (
            <NextImage src={logo} width={236 / 1.36} height={35 / 1.36} />
          )}
          <p className={styles.desc}>Simulator</p>
        </div>
        <div className={styles.poweredTextMainHeader}>
          <p className={styles.poweredText}>Powered by</p>
          <NextImage
            className={styles.poweredLogo}
            src={logoStep}
            width={53}
            height={21}
          />
        </div>
      </div>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          background:
            "radial-gradient(circle, rgba(256, 256, 256, 1) 10%, rgba(240, 240, 240) 50%)",
          //margin: "auto",
        }}
      >
        <ThreeDViewer product={product} />
      </main>
    </div>
  );
};

export default Home;
