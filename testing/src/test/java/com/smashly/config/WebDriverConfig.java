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
    private static final int DEFAULT_TIMEOUT = 10;

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
        WebDriver driver;

        if (browserProperty != null && !browserProperty.isEmpty()) {
            System.out.println("Using browser from property: " + browserProperty);
            switch (browserProperty.toLowerCase()) {
                case "chrome":
                    driver = createChromeDriver(headless);
                    break;
                case "firefox":
                    driver = createFirefoxDriver(headless);
                    break;
                case "edge":
                    driver = createEdgeDriver(headless);
                    break;
                case "safari":
                    driver = createSafariDriver(headless);
                    break;
                default:
                    System.out.println("Unknown browser: " + browserProperty + ". Defaulting to Chrome.");
                    driver = createChromeDriver(headless);
            }
        } else {
            // Auto-detect based on OS
            if (isMacOS()) {
                driver = createSafariDriver(headless);
            } else if (isWindows()) {
                driver = createEdgeDriver(headless);
            } else {
                System.out.println("Linux/Unix detected. Defaulting to Chrome.");
                driver = createChromeDriver(headless);
            }
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
        return System.getProperty("test.base.url", System.getProperty("frontend.url", "http://localhost:5173"));
    }

    /**
     * Gets API URL from system properties.
     */
    public static String getApiUrl() {
        return System.getProperty("test.api.url", System.getProperty("api.url", "http://localhost:443"));
    }
}