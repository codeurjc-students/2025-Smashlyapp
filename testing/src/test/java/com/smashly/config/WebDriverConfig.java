package com.smashly.config;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.safari.SafariDriver;
import org.openqa.selenium.safari.SafariOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.time.Duration;

/**
 * WebDriver configuration factory for E2E tests
 * Supports Safari (macOS), Edge (Windows), Chrome, and Firefox
 */
public class WebDriverConfig {

    private static final String BROWSER_PROPERTY = "test.browser";
    private static final String HEADLESS_PROPERTY = "test.headless";
    private static final String TIMEOUT_PROPERTY = "test.timeout";
    private static final String OS_NAME = System.getProperty("os.name").toLowerCase();

    private static final boolean DEFAULT_HEADLESS = true;
    private static final int DEFAULT_TIMEOUT = 20;

    /**
     * Creates and configures a WebDriver instance based on system properties or OS.
     * Priority: test.browser property > OS detection
     */
    public static WebDriver createDriver() {
        System.out.println("Detecting operating system: " + OS_NAME);

        boolean headless = Boolean
                .parseBoolean(System.getProperty(HEADLESS_PROPERTY, String.valueOf(DEFAULT_HEADLESS)));

        // Check for explicit browser property first
        String browserProperty = System.getProperty(BROWSER_PROPERTY);
        WebDriver driver = null;

        // Helper to try creating a driver with graceful fallback
        java.util.function.Supplier<WebDriver> tryChrome = () -> {
            try {
                return createChromeDriver(headless);
            } catch (RuntimeException e) {
                System.err.println("Chrome WebDriver initialization failed: " + e.getMessage());
                return null;
            }
        };
        java.util.function.Supplier<WebDriver> tryFirefox = () -> {
            try {
                return createFirefoxDriver(headless);
            } catch (RuntimeException e) {
                System.err.println("Firefox WebDriver initialization failed: " + e.getMessage());
                return null;
            }
        };
        java.util.function.Supplier<WebDriver> tryEdge = () -> {
            try {
                return createEdgeDriver(headless);
            } catch (RuntimeException e) {
                System.err.println("Edge WebDriver initialization failed: " + e.getMessage());
                return null;
            }
        };
        java.util.function.Supplier<WebDriver> trySafari = () -> {
            try {
                return createSafariDriver(headless);
            } catch (RuntimeException e) {
                System.err.println("Safari WebDriver initialization failed: " + e.getMessage());
                return null;
            }
        };

        if (browserProperty != null && !browserProperty.isEmpty()) {
            System.out.println("Using browser from property: " + browserProperty);
            switch (browserProperty.toLowerCase()) {
                case "chrome":
                    driver = tryChrome.get();
                    if (driver == null) driver = isMacOS() ? trySafari.get() : tryFirefox.get();
                    break;
                case "firefox":
                    driver = tryFirefox.get();
                    if (driver == null) driver = tryChrome.get();
                    if (driver == null && isMacOS()) driver = trySafari.get();
                    break;
                case "edge":
                    driver = tryEdge.get();
                    if (driver == null) driver = tryChrome.get();
                    if (driver == null) driver = tryFirefox.get();
                    break;
                case "safari":
                    driver = trySafari.get();
                    if (driver == null) driver = tryChrome.get();
                    if (driver == null) driver = tryFirefox.get();
                    break;
                default:
                    System.out.println("Unknown browser: " + browserProperty + ". Defaulting to Chrome.");
                    driver = tryChrome.get();
                    if (driver == null) driver = isMacOS() ? trySafari.get() : tryFirefox.get();
            }
        } else {
            // Auto-detect based on OS with robust fallbacks
            if (isMacOS()) {
                driver = trySafari.get();
                if (driver == null) driver = tryChrome.get();
                if (driver == null) driver = tryFirefox.get();
            } else if (isWindows()) {
                driver = tryEdge.get();
                if (driver == null) driver = tryChrome.get();
                if (driver == null) driver = tryFirefox.get();
            } else {
                System.out.println("Linux/Unix detected. Trying Chrome, then Firefox.");
                driver = tryChrome.get();
                if (driver == null) driver = tryFirefox.get();
            }
        }

        if (driver == null) {
            throw new RuntimeException("Failed to initialize any WebDriver (Chrome/Firefox/Safari/Edge). Please ensure at least one browser is installed and configured.");
        }

        // Configure timeouts
        int timeoutSeconds = Integer.parseInt(System.getProperty(TIMEOUT_PROPERTY, String.valueOf(DEFAULT_TIMEOUT)));
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(timeoutSeconds));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(timeoutSeconds * 3));

        // Maximize window if not headless
        if (!headless) {
            driver.manage().window().maximize();
        }

        return driver;
    }

    /**
     * Creates and configures a Safari WebDriver instance for macOS.
     */
    private static WebDriver createSafariDriver(boolean headless) {
        System.out.println("Configuring WebDriver for Safari on macOS...");

        SafariOptions safariOptions = new SafariOptions();
        safariOptions.setAutomaticInspection(false);
        safariOptions.setUseTechnologyPreview(false);

        // Note: Safari doesn't support headless mode natively
        if (headless) {
            System.out.println("Warning: Safari does not support headless mode. Running in normal mode.");
        }

        WebDriver driver = new SafariDriver(safariOptions);
        System.out.println("Safari WebDriver created successfully.");
        return driver;
    }

    /**
     * Creates and configures a Chrome WebDriver instance.
     */
    private static WebDriver createChromeDriver(boolean headless) {
        System.out.println("Configuring WebDriver for Chrome...");

        try {
            WebDriverManager.chromedriver().setup();
            System.out.println("Chrome WebDriver setup completed.");
        } catch (Exception e) {
            System.err.println("WebDriverManager error: " + e.getMessage());
            throw new RuntimeException("Failed to setup Chrome WebDriver", e);
        }

        ChromeOptions chromeOptions = new ChromeOptions();
        chromeOptions.addArguments("--remote-allow-origins=*");
        chromeOptions.addArguments("--disable-blink-features=AutomationControlled");
        chromeOptions.addArguments("--no-sandbox");
        chromeOptions.addArguments("--disable-dev-shm-usage");
        chromeOptions.addArguments("--disable-gpu");
        chromeOptions.addArguments("--window-size=1920,1080");

        if (headless) {
            chromeOptions.addArguments("--headless=new");
        }

        // Attempt to locate Chrome binary explicitly if ChromeDriver cannot find it
        String chromeBinary = detectChromeBinary();
        if (chromeBinary != null) {
            System.out.println("Using detected Chrome binary: " + chromeBinary);
            chromeOptions.setBinary(chromeBinary);
        } else {
            System.out.println("No explicit Chrome binary detected; relying on default discovery.");
        }

        try {
            WebDriver driver = new ChromeDriver(chromeOptions);
            System.out.println("Chrome WebDriver created successfully.");
            return driver;
        } catch (Exception e) {
            System.err.println("Failed to create Chrome WebDriver: " + e.getMessage());
            throw new RuntimeException("Could not initialize Chrome WebDriver", e);
        }
    }

    /**
     * Attempts to detect the Chrome binary path via env vars, system properties, and common locations.
     */
    private static String detectChromeBinary() {
        // Check environment variables typically used in CI
        String[] envVars = {"CHROME_PATH", "GOOGLE_CHROME_SHIM"};
        for (String var : envVars) {
            String val = System.getenv(var);
            if (val != null && !val.isBlank() && new File(val).exists()) {
                return val;
            }
        }

        // Check an explicit system property if provided
        String prop = System.getProperty("chrome.binary");
        if (prop != null && !prop.isBlank() && new File(prop).exists()) {
            return prop;
        }

        // Common installation paths by OS
        if (isMacOS()) {
            String[] macPaths = {
                    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
                    "/Applications/Chromium.app/Contents/MacOS/Chromium"
            };
            for (String p : macPaths) {
                if (new File(p).exists()) return p;
            }
        } else if (isWindows()) {
            String[] winPaths = {
                    "C\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
                    "C\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe"
            };
            for (String p : winPaths) {
                if (new File(p).exists()) return p;
            }
        } else {
            String[] linuxPaths = {
                    "/usr/bin/google-chrome",
                    "/usr/bin/google-chrome-stable",
                    "/usr/bin/chromium",
                    "/usr/bin/chromium-browser",
                    "/snap/bin/chromium"
            };
            for (String p : linuxPaths) {
                if (new File(p).exists()) return p;
            }
        }

        return null;
    }

    /**
     * Creates and configures a Firefox WebDriver instance.
     */
    private static WebDriver createFirefoxDriver(boolean headless) {
        System.out.println("Configuring WebDriver for Firefox...");

        try {
            WebDriverManager.firefoxdriver().setup();
            System.out.println("Firefox WebDriver setup completed.");
        } catch (Exception e) {
            System.err.println("WebDriverManager error: " + e.getMessage());
            throw new RuntimeException("Failed to setup Firefox WebDriver", e);
        }

        FirefoxOptions firefoxOptions = new FirefoxOptions();
        firefoxOptions.addArguments("--width=1920");
        firefoxOptions.addArguments("--height=1080");

        if (headless) {
            firefoxOptions.addArguments("--headless");
        }

        try {
            WebDriver driver = new FirefoxDriver(firefoxOptions);
            System.out.println("Firefox WebDriver created successfully.");
            return driver;
        } catch (Exception e) {
            System.err.println("Failed to create Firefox WebDriver: " + e.getMessage());
            throw new RuntimeException("Could not initialize Firefox WebDriver", e);
        }
    }

    /**
     * Creates and configures an Edge WebDriver instance for Windows.
     */
    private static WebDriver createEdgeDriver(boolean headless) {
        System.out.println("Configuring WebDriver for Microsoft Edge...");

        try {
            WebDriverManager.edgedriver()
                    .clearDriverCache()
                    .clearResolutionCache()
                    .setup();
            System.out.println("Edge WebDriver setup completed.");
        } catch (Exception e) {
            System.err.println("WebDriverManager error: " + e.getMessage());
            throw new RuntimeException("Failed to setup Edge WebDriver", e);
        }

        EdgeOptions edgeOptions = new EdgeOptions();
        edgeOptions.addArguments("--remote-allow-origins=*");
        edgeOptions.addArguments("--disable-blink-features=AutomationControlled");
        edgeOptions.addArguments("--no-sandbox");
        edgeOptions.addArguments("--disable-dev-shm-usage");
        edgeOptions.addArguments("--disable-gpu");
        edgeOptions.addArguments("--window-size=1920,1080");

        if (headless) {
            edgeOptions.addArguments("--headless=new");
        }

        try {
            WebDriver driver = new EdgeDriver(edgeOptions);
            System.out.println("Microsoft Edge WebDriver created successfully.");
            return driver;
        } catch (Exception e) {
            System.err.println("Failed to create Edge WebDriver: " + e.getMessage());
            throw new RuntimeException("Could not initialize Edge WebDriver", e);
        }
    }

    /**
     * Checks if the current OS is macOS.
     */
    private static boolean isMacOS() {
        return OS_NAME.contains("mac") || OS_NAME.contains("darwin");
    }

    /**
     * Checks if the current OS is Windows.
     */
    private static boolean isWindows() {
        return OS_NAME.contains("win");
    }

    /**
     * Creates WebDriverWait instance with configured timeout.
     */
    public static WebDriverWait createWait(WebDriver driver) {
        int timeoutSeconds = Integer.parseInt(System.getProperty(TIMEOUT_PROPERTY, String.valueOf(DEFAULT_TIMEOUT)));
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
    }

    /**
     * Gets frontend URL from system properties.
     */
    public static String getFrontendUrl() {
        // Prefer explicit frontend.url over test.base.url to avoid conflicts with API URL defaults
        return System.getProperty("frontend.url", System.getProperty("test.base.url", "http://localhost:5173"));
    }

    /**
     * Gets API URL from system properties.
     */
    public static String getApiUrl() {
        return System.getProperty("test.api.url", System.getProperty("api.url", "http://localhost:443"));
    }
}