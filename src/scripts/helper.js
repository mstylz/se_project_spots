// src/scripts/helper.js
import avatarFallback from "../images/avatar.jpg";

export function safeSetAvatar(imgEl, url) {
    if (!imgEl) return;

    const testImg = new Image();

    testImg.onload = () => {
        imgEl.src = url;
    };

    testImg.onerror = () => {
        console.warn("Image URL failed to load, using fallback:", url);
        imgEl.src = avatarFallback; // fallback image
    };

    if (url && typeof url === "string" && url.startsWith("http")) {
        testImg.src = url;
    } else {
        // If no valid URL, immediately fallback
        imgEl.src = avatarFallback;
    }
}