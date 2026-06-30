import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import type { EntrepriseSettings } from "../get-entreprise-settings";
import {
  renderDevisHtml,
  type DevisPdfData,
} from "./render-devis-html";

const CHROME_EXECUTABLES_BY_PLATFORM: Partial<Record<NodeJS.Platform, string[]>> =
  {
    win32: [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ],
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ],
  };

function getLocalChromeExecutable() {
  const configuredPath = process.env.PDF_CHROMIUM_EXECUTABLE_PATH?.trim();

  if (configuredPath) {
    if (!existsSync(configuredPath)) {
      throw new Error(
        "PDF_CHROMIUM_EXECUTABLE_PATH ne pointe vers aucun exécutable."
      );
    }

    return configuredPath;
  }

  return CHROME_EXECUTABLES_BY_PLATFORM[process.platform]?.find(existsSync);
}

async function getChromeLaunchOptions() {
  const localExecutable = getLocalChromeExecutable();

  if (localExecutable) {
    return {
      executablePath: localExecutable,
      args: await puppeteer.defaultArgs({
        headless: "shell",
      }),
    };
  }

  if (process.platform !== "linux") {
    throw new Error(
      "Chrome est introuvable. Configurez PDF_CHROMIUM_EXECUTABLE_PATH."
    );
  }

  return {
    executablePath: await chromium.executablePath(),
    args: await puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
  };
}

export async function generateServerDevisPdf(
  devis: DevisPdfData,
  entreprise: EntrepriseSettings
): Promise<Buffer> {
  const launchOptions = await getChromeLaunchOptions();
  const browser = await puppeteer.launch({
    ...launchOptions,
    defaultViewport: {
      width: 1100,
      height: 900,
      deviceScaleFactor: 1,
    },
    headless: "shell",
  });

  try {
    const page = await browser.newPage();

    await page.setContent(renderDevisHtml(devis, entreprise), {
      waitUntil: "load",
      timeout: 30_000,
    });
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
