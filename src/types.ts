export {};

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
