import os
import sys
import subprocess
from appium.options.android import UiAutomator2Options
from appium import webdriver

# Default Test Settings
DEFAULT_BACKEND_URL = "http://127.0.0.1:8000"
DEFAULT_APPIUM_URL = "http://127.0.0.1:4723"
APP_PACKAGE = "com.biopatch.ai"
APP_ACTIVITY = "com.biopatch.ai.MainActivity"
IMPLICIT_WAIT_SEC = 10
EXPLICIT_WAIT_SEC = 15

def find_adb_path() -> str:
    """ Resolves adb executable path on host system """
    sdk_adb = os.path.expanduser(r"~\AppData\Local\Android\Sdk\platform-tools\adb.exe")
    if os.path.exists(sdk_adb):
        return sdk_adb
    return "adb"

def get_connected_device() -> str:
    """ Queries adb devices to get the first available Android device or emulator """
    adb_cmd = find_adb_path()
    try:
        res = subprocess.run([adb_cmd, "devices"], capture_output=True, text=True, timeout=5)
        lines = res.stdout.strip().split('\n')
        for line in lines[1:]:
            parts = line.strip().split()
            if len(parts) >= 2 and parts[1] == "device":
                return parts[0]
    except Exception as e:
        print(f"Warning querying adb devices: {e}")
    return "emulator-5554"

def get_apk_path() -> str:
    """ Returns absolute path to built BioPatch AI Android APK """
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    apk_path = os.path.join(repo_root, "mobile", "build", "app", "outputs", "flutter-apk", "app-debug.apk")
    return apk_path

def get_android_options(apk_path: str = None, device_id: str = None) -> UiAutomator2Options:
    """ Configures Appium UiAutomator2 Options for Android automation """
    if apk_path is None:
        apk_path = get_apk_path()
    if device_id is None:
        device_id = get_connected_device()

    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"
    options.device_name = device_id
    options.app_package = APP_PACKAGE
    options.app_activity = APP_ACTIVITY
    options.auto_grant_permissions = True
    options.new_command_timeout = 300
    options.set_capability("noReset", False)

    if os.path.exists(apk_path):
        options.app = apk_path
        
    return options

def create_appium_driver(appium_url: str = DEFAULT_APPIUM_URL, apk_path: str = None, device_id: str = None):
    """ Creates and initializes an Appium Android WebDriver instance """
    options = get_android_options(apk_path=apk_path, device_id=device_id)
    driver = webdriver.Remote(command_executor=appium_url, options=options)
    driver.implicitly_wait(IMPLICIT_WAIT_SEC)
    return driver
