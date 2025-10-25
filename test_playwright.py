#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def test_playwright():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.google.com")
        title = await page.title()
        print(f"Page title: {title}")
        await browser.close()
        print("Playwright test successful!")

if __name__ == "__main__":
    asyncio.run(test_playwright())