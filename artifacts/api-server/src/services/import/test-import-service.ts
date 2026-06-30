import { importServiceManager } from "./index";

// Test the import service manager
async function testImportServiceManager() {
  console.log("Testing Import Service Manager...");

  try {
    // Initialize default configurations
    await importServiceManager.initializeDefaultConfigs();
    console.log("✓ Default configurations initialized");

    // Get status of all services
    const status = await importServiceManager.getAllStatus();
    console.log(`✓ Retrieved status for ${status.length} sources`);

    // Test getting a specific service
    const linkedInService = importServiceManager.getService("linkedin");
    if (linkedInService) {
      console.log("✓ LinkedIn service retrieved successfully");

      // Test getting status of LinkedIn service
      const linkedInStatus = await linkedInService.getStatus();
      console.log(`✓ LinkedIn service status: ${linkedInStatus.status}`);
    } else {
      console.log("✗ Failed to get LinkedIn service");
    }

    console.log("Import Service Manager test completed successfully");
  } catch (error) {
    console.error("✗ Import Service Manager test failed:", error);
    process.exit(1);
  }
}

// Run the test
testImportServiceManager();