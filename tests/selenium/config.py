import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Default Test Settings
DEFAULT_WEB_URL = "http://localhost:5173"
DEFAULT_BACKEND_URL = "http://127.0.0.1:8000"
IMPLICIT_WAIT_SEC = 10
EXPLICIT_WAIT_SEC = 15

def get_chrome_options(headless: bool = True) -> Options:
    """ Configures Chrome WebDriver options for headless and GUI execution """
    options = Options()
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1440,900')
    options.add_argument('--allow-insecure-localhost')
    options.add_argument('--disable-notifications')
    return options

def create_driver(headless: bool = True) -> webdriver.Chrome:
    """ Creates and initializes a Selenium Chrome WebDriver instance """
    options = get_chrome_options(headless=headless)
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(IMPLICIT_WAIT_SEC)
    driver.set_page_load_timeout(30)
    return driver
