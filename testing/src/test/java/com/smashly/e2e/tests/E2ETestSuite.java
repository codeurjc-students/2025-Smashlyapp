package com.smashly.e2e.tests;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

/**
 * E2E Test Suite for Smashly Application
 * 
 * This suite runs all End-to-End tests including:
 * - Frontend system tests (UI verification)
 * - API integration verification  
 * - Complete user workflow tests
 */
@Suite
@SuiteDisplayName("Smashly E2E Test Suite")
@SelectClasses({
    FrontendSystemTest.class,
    ApiIntegrationTest.class
})
public class E2ETestSuite {
    // This class remains empty, it is used only as a holder for the above annotations
}