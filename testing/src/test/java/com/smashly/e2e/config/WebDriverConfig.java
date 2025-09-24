package com.smashly.e2e.config;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * WebDriver configuration and factory for E2E tests
 */
public class WebDriverConfig {
    
    private static final String BROWSER_PROPERTY = "test.browser";
    private static final String HEADLESS_PROPERTY = "test.headless";
    private static final String TIMEOUT_PROPERTY = "test.timeout";
    
    private static final String DEFAULT_BROWSER = "chrome";
    private static final boolean DEFAULT_HEADLESS = true;
    private static final int DEFAULT_TIMEOUT = 10;
    
    /**
     * Creates and configures WebDriver instance based on system properties
     */
    public static WebDriver createDriver() {
        String browser = System.getProperty(BROWSER_PROPERTY, DEFAULT_BROWSER).toLowerCase();
        boolean headless = Boolean.parseBoolean(System.getProperty(HEADLESS_PROPERTY, String.valueOf(DEFAULT_HEADLESS)));
        
        WebDriver driver;
        
        switch (browser) {
            case "firefox":
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions firefoxOptions = new FirefoxOptions();
                if (headless) {
                    firefoxOptions.addArguments("--headless");
                }
                firefoxOptions.addArguments("--no-sandbox");
                firefoxOptions.addArguments("--disable-dev-shm-usage");
                driver = new FirefoxDriver(firefoxOptions);
                break;
                
            case "edge":
                WebDriverManager.edgedriver().setup();
                EdgeOptions edgeOptions = new EdgeOptions();
                if (headless) {
                    edgeOptions.addArguments("--headless");
                }
                edgeOptions.addArguments("--no-sandbox");
                edgeOptions.addArguments("--disable-dev-shm-usage");
                driver = new EdgeDriver(edgeOptions);
                break;
                
            case "chrome":
            default:
                WebDriverManager.chromedriver().setup();
                ChromeOptions chromeOptions = new ChromeOptions();
                if (headless) {
                    chromeOptions.addArguments("--headless");
                }
                chromeOptions.addArguments("--no-sandbox");
                chromeOptions.addArguments("--disable-dev-shm-usage");
                chromeOptions.addArguments("--disable-gpu");
                chromeOptions.addArguments("--window-size=1920,1080");
                driver = new ChromeDriver(chromeOptions);
                break;
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
     * Creates WebDriverWait instance with configured timeout
     */
    public static WebDriverWait createWait(WebDriver driver) {
        int timeoutSeconds = Integer.parseInt(System.getProperty(TIMEOUT_PROPERTY, String.valueOf(DEFAULT_TIMEOUT)));
        return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
    }
    
    /**
     * Gets frontend URL from system properties
     */
    public static String getFrontendUrl() {
        return System.getProperty("frontend.url", "http://localhost:5173");
    }
    
    /**
     * Gets API URL from system properties
     */
    public static String getApiUrl() {
        return System.getProperty("api.url", "http://localhost:3001");
    }
}