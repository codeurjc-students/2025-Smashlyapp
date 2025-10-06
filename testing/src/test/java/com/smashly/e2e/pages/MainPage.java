package com.smashly.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

public class MainPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // Page elements
    @FindBy(tagName = "h1")
    private WebElement pageTitle;

    @FindBy(tagName = "ul")
    private WebElement racketsList;

    @FindBy(tagName = "li")
    private List<WebElement> racketItems;

    @FindBy(xpath = "//p[contains(text(), 'Total de palas mostradas')]")
    private WebElement totalCount;

    // Loading and error states
    @FindBy(xpath = "//div[contains(text(), 'Cargando palas')]")
    private WebElement loadingMessage;

    @FindBy(xpath = "//div[contains(text(), 'Error:')]")
    private WebElement errorMessage;

    @FindBy(xpath = "//p[contains(text(), 'No se encontraron palas')]")
    private WebElement noRacketsMessage;

    public MainPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
        PageFactory.initElements(driver, this);
    }

    /**
     * Navigate to the main page
     */
    public MainPage navigateTo(String baseUrl) {
        driver.get(baseUrl);
        return this;
    }

    /**
     * Wait for the page to load completely
     */
    public MainPage waitForPageLoad() {
        // Wait for title to be present
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("h1")));

        // Wait for loading to complete (loading message should disappear)
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(
                    By.xpath("//div[contains(text(), 'Cargando palas')]")));
        } catch (Exception e) {
            // Loading message might not appear if data loads quickly
        }

        return this;
    }

    /**
     * Get the page title text
     */
    public String getPageTitle() {
        return pageTitle.getText();
    }

    /**
     * Check if rackets list is displayed
     */
    public boolean isRacketsListDisplayed() {
        try {
            return racketsList.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get the number of rackets displayed
     */
    public int getRacketsCount() {
        // Wait for rackets to load
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("li")));
        return racketItems.size();
    }

    /**
     * Get list of all racket elements
     */
    public List<WebElement> getRacketItems() {
        wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.tagName("li")));
        return racketItems;
    }

    /**
     * Get the total count text
     */
    public String getTotalCountText() {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(
                    By.xpath("//p[contains(text(), 'Total de palas mostradas')]")));
            return totalCount.getText();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Extract number from total count text
     */
    public int getTotalCountNumber() {
        String text = getTotalCountText();
        if (text.isEmpty())
            return 0;

        // Extract number from "Total de palas mostradas: X"
        String[] parts = text.split(":");
        if (parts.length > 1) {
            try {
                return Integer.parseInt(parts[1].trim());
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    /**
     * Check if error message is displayed
     */
    public boolean isErrorDisplayed() {
        try {
            return errorMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get error message text
     */
    public String getErrorMessage() {
        try {
            return errorMessage.getText();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Check if "no rackets" message is displayed
     */
    public boolean isNoRacketsMessageDisplayed() {
        try {
            return noRacketsMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if loading message is displayed
     */
    public boolean isLoadingDisplayed() {
        try {
            return loadingMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Verify that racket data contains expected information
     */
    public boolean verifyRacketData() {
        List<WebElement> rackets = getRacketItems();

        if (rackets.isEmpty()) {
            return false;
        }

        // Check first few rackets for required data
        for (int i = 0; i < Math.min(5, rackets.size()); i++) {
            WebElement racket = rackets.get(i);
            String text = racket.getText();

            // Each racket should have some text (name at minimum)
            if (text == null || text.trim().isEmpty()) {
                return false;
            }

            // Use the structured parser to check for name + (brand or price)
            RacketInfo info = RacketInfo.fromText(text);
            if (!info.hasName()) {
                return false;
            }

            if (!(info.hasBrand() || info.hasPrice())) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get details of a specific racket by index
     */
    public RacketInfo getRacketInfo(int index) {
        if (index >= getRacketsCount()) {
            throw new IndexOutOfBoundsException("Racket index " + index + " is out of bounds");
        }

        WebElement racket = racketItems.get(index);
        String text = racket.getText();

        return RacketInfo.fromText(text);
    }

    /**
     * Data class to hold racket information
     */
    public static class RacketInfo {
        public final String name;
        public final String brand;
        public final String price;
        public final String fullText;

        private RacketInfo(String name, String brand, String price, String fullText) {
            this.name = name;
            this.brand = brand;
            this.price = price;
            this.fullText = fullText;
        }

        public static RacketInfo fromText(String text) {
            // Parse text attempting to extract price and brand robustly
            String name = "";
            String brand = "";
            String price = "";

            if (text != null) {
                // Try splitting by common separator
                String[] parts = text.split(" - ");
                if (parts.length >= 1) {
                    name = parts[0].trim();
                }
                if (parts.length >= 2) {
                    brand = parts[1].trim();
                }
                if (parts.length >= 3) {
                    price = parts[2].trim();
                }

                // If price not found, try to find currency/number patterns anywhere in the text
                if ((price == null || price.isEmpty())) {
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("(\\d+[\\.,]?\\d*\\s*€)",
                            java.util.regex.Pattern.CASE_INSENSITIVE);
                    java.util.regex.Matcher m = p.matcher(text);
                    if (m.find()) {
                        price = m.group(1).trim();
                    }
                }

                // If brand is empty, attempt to guess a brand token (all-caps or capitalized
                // word)
                if ((brand == null || brand.isEmpty())) {
                    java.util.regex.Pattern bp = java.util.regex.Pattern.compile("([A-Z]{2,}|[A-Z][a-z]{2,})");
                    java.util.regex.Matcher bm = bp.matcher(text);
                    while (bm.find()) {
                        String candidate = bm.group(1).trim();
                        // Avoid picking the name if it's the first token (common in product names)
                        if (!candidate.equalsIgnoreCase(name) && candidate.length() > 1) {
                            brand = candidate;
                            break;
                        }
                    }
                }
            }

            return new RacketInfo(name, brand, price, text);
        }

        public boolean hasName() {
            return name != null && !name.isEmpty();
        }

        public boolean hasBrand() {
            return brand != null && !brand.isEmpty();
        }

        public boolean hasPrice() {
            if (price != null && !price.isEmpty())
                return true;
            // fallback: check for digits indicating a price
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("\\d+");
            return p.matcher(fullText != null ? fullText : "").find();
        }
    }
}