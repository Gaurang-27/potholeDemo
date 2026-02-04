"use client";

import Script from "next/script";

export default function GoogleMap() {
  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyAlM8D4xL5ykt74Wg5_B9iD-3R13y_WAe0&libraries=maps,marker&v=beta`}
        strategy="afterInteractive"
      />

      <div style={{ height: "100vh", width: "100%" }}>
        {/* @ts-ignore */}
        <gmp-map
          center="30.351356,76.364524"
          zoom="4"
          map-id="DEMO_MAP_ID"
        >
          {/* @ts-ignore */}
          <gmp-advanced-marker position="30.351356,76.364524">
            <div style={{
              background: "red",
              color: "white",
              padding: "6px 10px",
              borderRadius: "8px"
            }}>
              Pothole 🚧
            </div>
          {/*@ts-ignore*/}
          </gmp-advanced-marker>
          {/* @ts-ignore */}
        </gmp-map>
      </div>
    </>
  );
}
