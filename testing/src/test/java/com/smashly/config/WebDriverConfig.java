package com.smashly.config;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.safari.SafariDriver;
import org.openqa.selenium.safari.SafariOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * WebDriver configuration factory for E2E tests
 * Automatically selects Safari on macOS and Edge on Windows
 */
public class WebDriverConfig {

    private static final String HEADLESS_PROPERTY = "test.headless";
    private static final String TIMEOUT_PROPERTY = "test.timeout";
    private static final String OS_NAME = System.getProperty("os.name").toLowerCase();

    private static final boolean DEFAULT_HEADLESS = true;
    private static final int DEFAULT_TIMEOUT = 10;

    /**
     * Creates and configures a WebDriver instance based on the operating system.
     * Uses Safari on macOS and Edge on Windows.
     */
    public static WebDriver createDriver() {
        System.out.println("Detecting operating system: " + OS_NAME);

        boolean headless = Boolean
                .parseBoolean(System.getProperty(HEADLESS_PROPERTY, String.valueOf(DEFAULT_HEADLESS)));

        WebDriver driver;

        if (isMacOS()) {
            driver = createSafariDriver(headless);
        } else if (isWindows()) {
            driver = createEdgeDriver(headless);
        } else {
            System.out.println("Unsupported OS detected. Defaulting to Edge driver.");
            driver = createEdgeDriver(headless);
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
     * Creates and configures an Edge WebDriver instance for Windows.
     */
    private static WebDriver createEdgeDriver(boolean headless) {
        System.out.println("Configuring WebDriver for Microsoft Edge on Windows...");

        // Setup for Edge
        try {
            WebDriverManager.edgedriver().setup();
        } catch (Exception e) {
            System.out.println("WebDriverManager failed, using system Edge driver as fallback.");
        }

        EdgeOptions edgeOptions = new EdgeOptions();
        if (headless) {
            edgeOptions.addArguments("--headless");
        }
        edgeOptions.addArguments("--no-sandbox");
        edgeOptions.addArguments("--disable-dev-shm-usage");
        edgeOptions.addArguments("--disable-gpu");
        edgeOptions.addArguments("--window-size=1920,1080");

        WebDriver driver = new EdgeDriver(edgeOptions);
        System.out.println("Microsoft Edge WebDriver created successfully.");
        return driver;
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
        return System.getProperty("test.api.url", System.getProperty("api.url", "http://localhost:3001"));
    }
}