export const isIOS = () => {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
};

export const supportsQuickLook = () => {
  return isIOS() && 'QuickLook' in window;
};

export const supportsWebXR = async () => {
  if (!window.isSecureContext) {
    return false;
  }

  if (!navigator.xr) {
    return false;
  }

  try {
    return await navigator.xr.isSessionSupported('immersive-ar');
  } catch (err) {
    console.error("Error checking WebXR support:", err);
    return false;
  }
};

export const getARExperienceType = async () => {
  if (await supportsWebXR()) {
    return 'webxr';
  } else if (supportsQuickLook()) {
    return 'quicklook';
  }
  return 'none';
}; 