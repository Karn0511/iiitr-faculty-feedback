/**
 * Simple, high-performance User-Agent parser to identify Client OS and Browser.
 * Zero-dependency, lightweight, and robust for security dashboard telemetry.
 */
module.exports = (userAgent) => {
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (!userAgent) return { browser, os };

    // Detect OS
    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone')) os = 'iOS (iPhone)';
    else if (userAgent.includes('iPad')) os = 'iOS (iPad)';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('X11')) os = 'Unix';

    // Detect Browser
    if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) browser = 'Microsoft Edge';
    else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium')) browser = 'Google Chrome';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Apple Safari';
    else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) browser = 'Opera';
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) browser = 'Internet Explorer';

    return { browser, os };
};
