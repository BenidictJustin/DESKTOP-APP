import React, { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import logo3 from '../assets/logo3.png'

export default function SplashScreen({ onComplete }) {
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // 1.5 seconds display time before initiating smooth fade-out
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, 1500)

    // Complete splash & unmount at 2.0 seconds total
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 2000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#020516] flex flex-col items-center justify-center font-poppins selection:bg-sig-green/20 overflow-hidden transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Banner Graphic (logo3.png) - Complete Uncropped Artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Blurred background layer to fill margins on any aspect ratio */}
        <img
          src={logo3}
          alt="Background Blur"
          className="absolute inset-0 w-full h-full object-cover opacity-50 filter blur-xl scale-110 pointer-events-none"
        />
        {/* Clean foreground layer - fully visible, no cropping */}
        <img
          src={logo3}
          alt="Background Banner"
          className="absolute inset-0 w-full h-full object-contain object-center opacity-85 filter brightness-105 contrast-105 pointer-events-none"
        />
        {/* Subtle Dark Vignette & Gradient Overlay for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020519]/40 via-[#030E69]/30 to-[#02061f]/55 backdrop-blur-[1px]" />
      </div>

      {/* Main Splash Container */}
      <div className="flex flex-col items-center justify-center text-center z-10 px-6 animate-splash-scale relative">
        {/* Focal Point Dark Backdrop Glow for High Contrast */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#020516]/80 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sig-green/20 rounded-full blur-3xl pointer-events-none" />

        {/* Direct Focal Point Logo */}
        <img
          src={logo}
          alt="DommUnity Main Logo"
          className="h-32 w-32 md:h-40 md:w-40 object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)] mb-4 animate-subtle-float relative z-10"
        />

        {/* DommUnity Title in Bright Sig-Green */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-sig-green tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] relative z-10">
          DommUnity
        </h1>
      </div>
    </div>
  )
}
