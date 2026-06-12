"use client";

import { useEffect, useState } from "react";
import { Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadAloudButtonProps {
  text: string;
  language: string; // "en" | "es" | "fr"
  label?: string;
}

/** Browser SpeechSynthesis read-aloud for accessibility. Degrades to hidden if unsupported. */
export function ReadAloudButton({ text, language, label = "Read aloud" }: ReadAloudButtonProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speaking if the content or language changes underneath us.
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [text, language]);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === "es" ? "es-ES" : language === "fr" ? "fr-FR" : "en-US";
    utter.rate = 0.98;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(utter.lang.slice(0, 2)));
    if (voice) utter.voice = voice;
    synth.speak(utter);
    setSpeaking(true);
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} aria-pressed={speaking}>
      {speaking ? <Pause /> : <Volume2 />}
      {speaking ? "Stop" : label}
    </Button>
  );
}
