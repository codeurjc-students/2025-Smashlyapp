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
    @FindBy(xpath = "//*[contains(text(), 'Cargando catálogo')]")
    private WebElement loadingMessage;

    @FindBy(xpath = "//div[contains(text(), 'Error:')]")
    private WebElement errorMessage;

    @FindBy(xpath = "//*[contains(text(), 'No se encontraron palas')]")
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
        // Wait for title to be present with robust fallbacks
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("h1")));
        } catch (Exception e) {
            // Fallback: look for text containing "Catálogo" or presence of list items
            try {
                wait.until(ExpectedConditions.presenceOfElementLocated(
                        By.xpath("//*[contains(text(), 'Catálogo')]")
                ));
            } catch (Exception ignored) {
                try {
                    wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.tagName("li")));
                } catch (Exception ignored2) {
                    // If none are found, we proceed and let subsequent checks fail gracefully
                }
            }
        }

        // Wait for loading to complete (loading message should disappear)
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(
                    By.xpath("//div[contains(text(), 'Cargando palas')]")));
        } catch (Exception e) {
            // Loading message might not appear if data loads quickly
        }
        // Attempt alternative loading text used by current UI
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(
                    By.xpath("//*[contains(text(), 'Cargando catálogo')]")
            ));
        } catch (Exception ignored) {
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
        // Wait for rackets to load: tolerate cases where <ul> is not found by Safari
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("ul")));
            return racketsList.findElements(By.tagName("li")).size();
        } catch (Exception e) {
            // Fallback to page-level list items if <ul> is not present or scoping fails
            try {
                wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.tagName("li")));
                return racketItems.size();
            } catch (Exception ignored) {
                return 0;
            }
        }
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
        // Extract digits anywhere in the string, robust to format changes
        String digits = text.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return 0;
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return 0;
        }
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
     * Get the stat number for total "Palas" shown in the header stats.
     * This represents total rackets available, not necessarily the displayed count.
     */
    public int getPalasStatNumber() {
        try {
            // Strategy 1: Look specifically in body for "Palas" text that's a standalone label (not in title)
            // Use a more specific XPath that targets visible content in body
            WebElement label = wait.until(
                    ExpectedConditions.presenceOfElementLocated(
                            By.xpath("//body//*[normalize-space(text())='Palas']")
                    )
            );

            WebElement parent = label.findElement(By.xpath(".."));

            // Extract all numbers from the parent text (the StatNumber should be there)
            String parentText = parent.getText();
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+");
            java.util.regex.Matcher matcher = pattern.matcher(parentText);
            if (matcher.find()) {
                return Integer.parseInt(matcher.group());
            }
        } catch (Exception e) {
            // Ignore and try next strategy
        }

        // Strategy 2: Look for any div containing both a number and "Palas" text
        try {
            java.util.List<WebElement> candidates = driver.findElements(
                    By.xpath("//body//*[contains(text(), 'Palas')]")
            );

            for (WebElement candidate : candidates) {
                WebElement parent = candidate.findElement(By.xpath(".."));
                String parentText = parent.getText().trim();

                // Skip if this is the page title or contains too much text
                if (parentText.length() > 50) continue;

                // Extract number from parent
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+");
                java.util.regex.Matcher matcher = pattern.matcher(parentText);
                if (matcher.find() && parentText.contains("Palas")) {
                    return Integer.parseInt(matcher.group());
                }
            }
        } catch (Exception e) {
            // Ignore
        }

        return 0;
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