import { useEffect, useRef } from "react";
import warungEdinLogo from "../assets/warungedin.png";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // After the motor animation finishes (4.5s), fade out the overlay (0.4s)
    const fadeTimer = setTimeout(() => {
      overlayRef.current?.classList.add("fading");
    }, 4500);

    // After fade is complete, unmount
    const doneTimer = setTimeout(() => {
      onDone();
    }, 4900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      ref={overlayRef}
      className="splash-overlay fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#fff8f2" }}
    >
      {/* Subtle radial glow in center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(251,146,60,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Animated logo */}
      <img
        src={warungEdinLogo}
        alt="Warung Edin"
        className="splash-logo relative w-72 sm:w-96 md:w-[30rem] object-contain drop-shadow-xl"
        draggable={false}
      />
    </div>
  );
}
