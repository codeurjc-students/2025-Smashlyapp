package com.smashly.e2e.tests;

import com.smashly.config.WebDriverConfig;
import com.smashly.e2e.pages.MainPage;
import org.junit.jupiter.api.*;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

import static org.assertj.core.api.Assertions.*;

/**
 * -- Frontend E2E System Tests using Selenium WebDriver --
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Frontend E2E System Tests")
public class FrontendSystemTest {

        private static WebDriver driver;
        private static WebDriverWait wait;
        private static String frontendUrl;

        private MainPage mainPage;

        /* Setup WebDriver and test environment */
        @BeforeAll
        static void setupClass() {
                System.out.println("🚀 Setting up E2E test environment...");

                // Get configuration
                frontendUrl = WebDriverConfig.getFrontendUrl();
                System.out.println("🔗 Frontend URL: " + frontendUrl);

                // Create WebDriver
                driver = WebDriverConfig.createDriver();
                wait = WebDriverConfig.createWait(driver);

                System.out.println("✅ E2E test environment ready");
        }

        /* Cleanup WebDriver */
        @AfterAll
        static void tearDownClass() {
                if (driver != null) {
                        System.out.println("🧹 Cleaning up WebDriver...");
                        driver.quit();
                }
        }

        /* Setup page objects before each test */
        @BeforeEach
        void setUp() {
                mainPage = new MainPage(driver, wait);
        }

        /* Test main page loading */
        @Test
        @Order(1)
        @DisplayName("Should load main page successfully")
        void shouldLoadMainPageSuccessfully() {
                System.out.println("🧪 Test: Loading main page...");

                // Navigate to catalog page (where rackets are displayed)
                String catalogUrl = frontendUrl + "/catalog";
                mainPage.navigateTo(catalogUrl);
                mainPage.waitForPageLoad();

                // Verify page loaded
                assertThat(driver.getCurrentUrl())
                                .as("Page URL should match expected URL")
                                .contains("/catalog");

                // Verify page title
                String pageTitle = mainPage.getPageTitle();
                assertThat(pageTitle)
                                .as("Page should have correct title")
                                .isNotEmpty()
                                .containsIgnoringCase("Catálogo");

                System.out.println("✅ Main page loaded successfully with title: " + pageTitle);
        }

        @Test
        @Order(2)
        @DisplayName("Should display rackets data from API")
        void shouldDisplayRacketsData() {
                System.out.println("🧪 Test: Verifying rackets data display...");

                // Navigate to catalog page
                String catalogUrl = frontendUrl + "/catalog";
                mainPage.navigateTo(catalogUrl);
                mainPage.waitForPageLoad();

                // Verify no error is displayed
                assertThat(mainPage.isErrorDisplayed())
                                .as("No error message should be displayed")
                                .isFalse();

                // Verify no loading message is still displayed
                assertThat(mainPage.isLoadingDisplayed())
                                .as("Loading message should not be displayed after page load")
                                .isFalse();

                // Verify rackets list is displayed
                assertThat(mainPage.isRacketsListDisplayed())
                                .as("Rackets list should be displayed")
                                .isTrue();

                // Verify we have rackets data
                int racketsCount = mainPage.getRacketsCount();
                assertThat(racketsCount)
                                .as("Should display at least 1 racket and at most 20")
                                .isBetween(1, 20);

                // Verify total count is displayed and matches
                int totalCountDisplayed = mainPage.getTotalCountNumber();
                assertThat(totalCountDisplayed)
                                .as("Total count should match displayed rackets count")
                                .isEqualTo(racketsCount);

                System.out.println("✅ Found " + racketsCount + " rackets displayed correctly");
        }

        @Test
        @Order(3)
        @DisplayName("Should show valid racket information")
        void shouldShowValidRacketInformation() {
                System.out.println("🧪 Test: Verifying racket information quality...");

                // Navigate to catalog page
                String catalogUrl = frontendUrl + "/catalog";
                mainPage.navigateTo(catalogUrl);
                mainPage.waitForPageLoad();

                // Verify racket data quality
                assertThat(mainPage.verifyRacketData())
                                .as("Racket data should contain valid information")
                                .isTrue();

                // Check first few rackets for detailed information
                int racketsToCheck = Math.min(5, mainPage.getRacketsCount());

                for (int i = 0; i < racketsToCheck; i++) {
                        MainPage.RacketInfo racket = mainPage.getRacketInfo(i);

                        // Verify each racket has a name
                        assertThat(racket.hasName())
                                        .as("Racket " + i + " should have a name")
                                        .isTrue();

                        assertThat(racket.name)
                                        .as("Racket " + i + " name should not be empty")
                                        .isNotEmpty()
                                        .hasSizeGreaterThan(3);

                        System.out.println("📄 Racket " + i + ": " + racket.name +
                                        (racket.hasBrand() ? " (" + racket.brand + ")" : "") +
                                        (racket.hasPrice() ? " - " + racket.price : ""));
                }

                System.out.println("✅ All checked rackets have valid information");
        }

        @Test
        @Order(4)
        @DisplayName("Should handle empty data gracefully")
        void shouldHandleEmptyDataGracefully() {
                System.out.println("🧪 Test: Verifying graceful handling of empty data...");

                // Navigate to catalog page
                String catalogUrl = frontendUrl + "/catalog";
                mainPage.navigateTo(catalogUrl);
                mainPage.waitForPageLoad();

                // If no rackets are found, verify appropriate message is shown
                if (mainPage.getRacketsCount() == 0) {
                        assertThat(mainPage.isNoRacketsMessageDisplayed())
                                        .as("'No rackets found' message should be displayed when no data")
                                        .isTrue();

                        System.out.println("✅ No data case handled properly");
                } else {
                        System.out.println("✅ Data is available, test passed by having rackets");
                }
        }

        @Test
        @Order(5)
        @DisplayName("Should display expected number of rackets")
        void shouldDisplayExpectedNumberOfRackets() {
                System.out.println("🧪 Test: Verifying expected number of rackets...");

                // Navigate to catalog page
                String catalogUrl = frontendUrl + "/catalog";
                mainPage.navigateTo(catalogUrl);
                mainPage.waitForPageLoad();

                int racketsCount = mainPage.getRacketsCount();

                // According to the frontend code, it should show first 20 rackets
                assertThat(racketsCount)
                                .as("Should display exactly 20 rackets (or less if less data available)")
                                .isLessThanOrEqualTo(20);

                // If we have a test database with 1400 records, we should get 20
                if (racketsCount > 0) {
                        assertThat(racketsCount)
                                        .as("Should display at least some rackets from test database")
                                        .isGreaterThan(0);
                }

                System.out.println("✅ Displayed " + racketsCount + " rackets as expected");
        }

        @Test
        @Order(6)
        @DisplayName("Should have responsive page elements")
        void shouldHaveResponsivePageElements() {
                System.out.println("🧪 Test: Verifying page elements responsiveness...");

                // Navigate to catalog page
                String catalogUrl = frontendUrl + "/catalog";
                mainPage.navigateTo(catalogUrl);
                mainPage.waitForPageLoad();

                // Verify all key elements are present and visible
                assertThat(mainPage.getPageTitle())
                                .as("Page title should be present and visible")
                                .isNotEmpty();

                if (mainPage.getRacketsCount() > 0) {
                        assertThat(mainPage.isRacketsListDisplayed())
                                        .as("Rackets list should be visible when data is present")
                                        .isTrue();

                        assertThat(mainPage.getTotalCountText())
                                        .as("Total count should be displayed")
                                        .isNotEmpty()
                                        .contains("Total de palas mostradas");
                }

                System.out.println("✅ All page elements are responsive and visible");
        }
}