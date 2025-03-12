// Script to clear all authentication data for localhost
// To use: Copy this entire script and paste it into your browser console while on localhost:3000

(function clearAuthData() {
    console.log('🧹 Starting auth data cleanup and diagnostics...');

    // Initialize counters
    let localStorageCleared = 0;
    let sessionStorageCleared = 0;
    let cookiesCleared = 0;
    let authIssuesFound = 0;
    let diagnosticInfo = {};

    try {
        // STEP 1: Collect diagnostics to understand the issue
        console.log('📊 Collecting diagnostic information...');

        // Check for session endpoint loop
        if (window.performance) {
            const entries = window.performance.getEntriesByType('resource');
            const authRequests = entries.filter(entry =>
                entry.name.includes('/api/auth/session') ||
                entry.name.includes('/api/auth/csrf')
            );

            // Group by URL to see frequency
            const requestCounts = {};
            authRequests.forEach(req => {
                requestCounts[req.name] = (requestCounts[req.name] || 0) + 1;
            });

            diagnosticInfo.authRequestLoop = requestCounts;

            if (authRequests.length > 10) {
                console.warn(`⚠️ Detected high number of auth API calls (${authRequests.length}). Potential infinite loop.`);
                authIssuesFound++;
            }
        }

        // STEP 2: Clear localStorage
        console.log('🗑️ Clearing localStorage...');
        const lsKeys = Object.keys(localStorage);

        lsKeys.forEach(key => {
            try {
                console.log(`  - Removing localStorage key: ${key}`);
                localStorage.removeItem(key);
                localStorageCleared++;
            } catch (e) {
                console.error(`  ❌ Failed to remove localStorage key: ${key}`, e);
            }
        });

        // STEP 3: Clear sessionStorage
        console.log('🗑️ Clearing sessionStorage...');
        const ssKeys = Object.keys(sessionStorage);

        ssKeys.forEach(key => {
            try {
                console.log(`  - Removing sessionStorage key: ${key}`);
                sessionStorage.removeItem(key);
                sessionStorageCleared++;
            } catch (e) {
                console.error(`  ❌ Failed to remove sessionStorage key: ${key}`, e);
            }
        });

        // STEP 4: Clear cookies (multiple methods for thoroughness)
        console.log('🗑️ Clearing cookies...');

        // Method 1: Standard approach
        const cookieList = document.cookie.split('; ');
        cookieList.forEach(cookieStr => {
            try {
                const cookieName = cookieStr.split('=')[0];
                if (cookieName) {
                    console.log(`  - Removing cookie: ${cookieName}`);

                    // Try multiple deletion methods for thoroughness
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
                    document.cookie = `${cookieName}=; Max-Age=0; path=/`;
                    document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
                    cookiesCleared++;
                }
            } catch (e) {
                console.error(`  ❌ Failed to remove cookie: ${cookieStr}`, e);
            }
        });

        // Method 2: Focus specifically on NextAuth cookies
        const nextAuthCookies = [
            'next-auth.session-token',
            'next-auth.callback-url',
            'next-auth.csrf-token',
            '__Secure-next-auth.session-token',
            '__Host-next-auth.csrf-token',
            'fbquiz-session' // Custom cookie name
        ];

        nextAuthCookies.forEach(cookieName => {
            try {
                console.log(`  - Targeting NextAuth cookie: ${cookieName}`);

                // Try multiple deletion methods
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
                document.cookie = `${cookieName}=; Max-Age=0; path=/`;
                document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
            } catch (e) {
                console.error(`  ❌ Failed to remove NextAuth cookie: ${cookieName}`, e);
            }
        });

        // STEP 5: Break potential resource fetch loops
        console.log('🚫 Breaking potential fetch loops...');

        // Add a flag to prevent future session refreshes in this browser session
        window.SESSION_REFRESH_DISABLED = true;

        // Store diagnostics
        localStorage.setItem('auth_diagnostics', JSON.stringify({
            time: new Date().toISOString(),
            issues: authIssuesFound,
            data: diagnosticInfo,
            cleared: {
                localStorage: localStorageCleared,
                sessionStorage: sessionStorageCleared,
                cookies: cookiesCleared
            }
        }));

        // Final summary
        console.log('✅ Auth cleanup complete!');
        console.log(`📊 Summary:
  - ${localStorageCleared} localStorage items removed
  - ${sessionStorageCleared} sessionStorage items removed
  - ${cookiesCleared} cookies cleared
  - ${authIssuesFound} potential auth issues detected`);

        console.log('🔄 Please reload the page now to apply changes.\n   You can do this by pressing F5 or Ctrl+R (Cmd+R on Mac)');

    } catch (error) {
        console.error('❌ Error during auth cleanup:', error);
    }
})(); 