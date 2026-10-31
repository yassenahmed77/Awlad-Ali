"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "awlad_ali_pwa_installed";

export function usePwaInstall() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect if running as standalone app (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    const isStoredInstalled = localStorage.getItem(STORAGE_KEY) === "true";

    if (isStandalone || isStoredInstalled) {
      setIsInstalled(true);
      return; // Already installed -> Neither button nor popup will ever show
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Capture beforeinstallprompt event (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__pwaInstallPrompt = e;
    };

    // 4. Capture when app is successfully installed
    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsInstalled(true);
      setIsModalOpen(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Automatic popup on every site visit if NOT installed
    const popupTimer = setTimeout(() => {
      const stillStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        localStorage.getItem(STORAGE_KEY) === "true";

      if (!stillStandalone) {
        setIsModalOpen(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(popupTimer);
    };
  }, []);

  // One-click install handler: prompts native install immediately
  const triggerInstall = useCallback(async () => {
    const promptEvent = deferredPrompt || window.__pwaInstallPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          localStorage.setItem(STORAGE_KEY, "true");
          setIsInstalled(true);
          setIsModalOpen(false);
        }
        setDeferredPrompt(null);
        window.__pwaInstallPrompt = null;
        return;
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }

    // If native prompt is not directly available (e.g. iOS Safari), open the guide modal
    setIsModalOpen(true);
  }, [deferredPrompt]);

  const openModal = useCallback(() => {
    if (!isInstalled) {
      setIsModalOpen(true);
    }
  }, [isInstalled]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isInstalled,
    isModalOpen,
    isIOS,
    canPromptDirectly: Boolean(deferredPrompt || (typeof window !== "undefined" && window.__pwaInstallPrompt)),
    triggerInstall,
    openModal,
    closeModal,
  };
}

