package com.smashly.e2e;

import com.smashly.e2e.tests.FrontendSystemTest;
import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

@Suite
@SuiteDisplayName("Smashly E2E Test Suite")
@SelectClasses({
        FrontendSystemTest.class
})
public class E2ETestSuite {
}