import { Builder, By, WebDriver, until } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as fs from 'fs';
import * as path from 'path';

export class LinkedInBrowserAutomation {
  private driver: WebDriver | null = null;
  private isRunning: boolean = false;

  async initialize(): Promise<void> {
    const options = new chrome.Options();
    
    // IMPORTANT: headless=false for full visibility
    options.addArguments('--no-headless');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--allow-running-insecure-content');
    options.addArguments('--disable-features=TranslateUI');
    options.addArguments('--disable-extensions-file-access-check');
    options.addArguments('--disable-ipc-flooding-protection');
    
    // Use existing profile directory if available
    const profilePath = process.env.CHROME_PROFILE_PATH;
    if (profilePath && fs.existsSync(profilePath)) {
      options.addArguments(`--user-data-dir=${profilePath}`);
    }

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    this.isRunning = true;
  }

  async openLinkedInProfile(profileUrl: string): Promise<{ name: string; headline: string; company: string }> {
    if (!this.driver || !this.isRunning) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.driver.get(profileUrl);
      
      // Wait for page to load
      await this.driver.wait(until.elementLocated(By.css('main')), 10000);
      
      // Add realistic delay
      await this.delay(2000, 4000);

      // Extract profile information
      const name = await this.extractText('h1');
      const headline = await this.extractText('.text-body-medium.break-words, .top-card-layout__headline');
      const company = await this.extractText('.inline-show-more-text, .top-card-layout__headline + div');

      return {
        name: name || 'Unknown',
        headline: headline || 'No headline available', 
        company: company || 'No company listed'
      };
    } catch (error) {
      console.error('Error opening LinkedIn profile:', error);
      throw new Error(`Failed to open LinkedIn profile: ${error}`);
    }
  }

  async openMessageModal(): Promise<void> {
    if (!this.driver || !this.isRunning) {
      throw new Error('Browser not initialized');
    }

    try {
      // Look for message button
      const messageButton = await this.driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Message') or contains(@aria-label, 'Message')]")),
        10000
      );
      
      await messageButton.click();
      
      // Wait for message modal to appear
      await this.driver.wait(until.elementLocated(By.css('div[data-view-name="messaging-modal"]')), 5000);
      
      await this.delay(1000, 2000);
    } catch (error) {
      console.error('Error opening message modal:', error);
      throw new Error(`Failed to open message modal: ${error}`);
    }
  }

  async pasteMessage(message: string): Promise<void> {
    if (!this.driver || !this.isRunning) {
      throw new Error('Browser not initialized');
    }

    try {
      // Find message text area
      const messageField = await this.driver.wait(
        until.elementLocated(By.css('div[contenteditable="true"], textarea[placeholder*="message"], div[data-placeholder*="message"]')),
        5000
      );
      
      await messageField.clear();
      await messageField.sendKeys(message);
      
      await this.delay(500, 1000);
    } catch (error) {
      console.error('Error pasting message:', error);
      throw new Error(`Failed to paste message: ${error}`);
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.driver || !this.isRunning) {
      throw new Error('Browser not initialized');
    }

    try {
      // Find send button
      const sendButton = await this.driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Send') or contains(@aria-label, 'Send')]")),
        5000
      );
      
      await sendButton.click();
      
      // Wait for confirmation
      await this.delay(1000, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  async closeCurrentTab(): Promise<void> {
    if (!this.driver || !this.isRunning) {
      throw new Error('Browser not initialized');
    }

    try {
      const handles = await this.driver.getAllWindowHandles();
      if (handles.length > 1) {
        await this.driver.close();
        await this.driver.switchTo().window(handles[0]);
      }
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (error) {
        console.error('Error stopping browser:', error);
      }
      this.driver = null;
    }
  }

  private async extractText(selector: string): Promise<string> {
    if (!this.driver) return '';
    
    try {
      const element = await this.driver.findElement(By.css(selector));
      return await element.getText();
    } catch (error) {
      return '';
    }
  }

  private async delay(min: number, max?: number): Promise<void> {
    const delay = max ? min + Math.random() * (max - min) : min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  isActive(): boolean {
    return this.isRunning && this.driver !== null;
  }
}
