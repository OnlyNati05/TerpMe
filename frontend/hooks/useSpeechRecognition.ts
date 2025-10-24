declare global {
  interface Window {
    webkitSpeechRecognition: any;
    webkitSpeechGrammarList: any;
  }
}

import React, { useEffect, useRef, useState } from "react";

const useSpeechRecognition = (opts?: {
  interimResults: boolean;
  lang: string;
  continuous: boolean;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Web Speech API not supported");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current!;
    recognition.interimResults = opts?.interimResults || true;
    recognition.lang = opts?.lang || "en-US";
    recognition.continuous = opts?.continuous || true;

    if ("webkitSpeechGrammarList" in window) {
      const grammar =
        "#JSGF V1.0; grammar punctuation; public <punc> = . | , | ? | ! | ; | : ;";
      const speechRecognitionList = new window.webkitSpeechGrammarList();
      speechRecognitionList.addFromString(grammar, 1);
      recognition.grammars = speechRecognitionList;
    }

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error: ", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript("");
    };

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stoptListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stoptListening,
  };
};

export default useSpeechRecognition;
