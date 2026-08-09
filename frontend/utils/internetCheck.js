/**
 * Checks for internet connectivity and estimates latency.
 * Pings a high-availability server (Google) with a small request.
 * 
 * @returns {Promise<{
 *   sufficient: boolean, 
 *   latency: number, 
 *   message: string 
 * }>}
 */
export const checkInternetConnection = async () => {
    // 1. Fail Fast: Check browser's online status
    if (!navigator.onLine) {
        return {
            sufficient: false,
            latency: -1,
            message: 'No Internet Connection (Offline Mode)'
        };
    }

    try {
        const start = Date.now();
        const TIMEOUT = 5000; // 5 seconds timeout
        const LATENCY_THRESHOLD = 3000; // 3 seconds - acceptable for simple voting interactions? 
        // Actually, let's keep it generous for mobile networks.

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        // Ping a reliable static resource (favicon or similar) or just a small fetch
        // Using 'no-cache' to ensure we actually hit the network
        const response = await fetch('https://www.google.com/favicon.ico?' + start, {
            mode: 'no-cors', // We just need to know if it connects, not read it
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const end = Date.now();
        const latency = end - start;

        if (latency > LATENCY_THRESHOLD) {
            return {
                sufficient: false,
                latency,
                message: `Internet too slow (${latency}ms). Please check your connection.`
            };
        }

        return {
            sufficient: true,
            latency,
            message: 'Connection Good'
        };

    } catch (error) {
        return {
            sufficient: false,
            latency: -1,
            message: 'No internet connection verified.'
        };
    }
};
