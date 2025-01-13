function findUrls() {
  const urls = [];
  const sources = [
    ...document.getElementsByTagName("a"),
    ...document.getElementsByTagName("script"),
    ...document.getElementsByTagName("img"),
    ...document.getElementsByTagName("link"),
    ...document.getElementsByTagName("form"),
  ];

  sources.forEach((element) => {
    if (element.href) urls.push(new URL(element.href, document.baseURI).href);
    if (element.src) urls.push(new URL(element.src, document.baseURI).href);
    if (element.action) urls.push(new URL(element.action, document.baseURI).href);
  });

  const content = document.documentElement.innerHTML;
  const urlPattern = /(?:url\(|href="|src="|action="|url:|endpoint:|path:|route:)\s*['"]?([^'"\)\s>]+)/gi;
  let match;
  while ((match = urlPattern.exec(content)) !== null) {
    if (match[1] && !match[1].startsWith("data:")) {
      try {
        urls.push(new URL(match[1], document.baseURI).href);
      } catch (error) {
        console.warn(`Invalid URL: ${match[1]}`);
      }
    }
  }

  const scriptPattern = /"[^"]*"|'[^']*'/g;
  const scripts = document.documentElement.innerHTML.match(scriptPattern) || [];
  scripts.forEach((script) => {
    const urlMatches = script.match(/(?:\/[a-zA-Z0-9_-]+)+(?:\.[a-zA-Z0-9]+)?/g) || [];
    urlMatches.forEach((url) => {
      try {
        urls.push(new URL(url, document.baseURI).href);
      } catch (error) {
        console.warn(`Invalid URL: ${url}`);
      }
    });
  });

  performance.getEntriesByType("resource").forEach((entry) => urls.push(entry.name));
  return [...new Set(urls)];
}

function detectVulnerabilities(url) {
  const vulnerabilities = [];
  try {
    const urlObj = new URL(url);
    if (urlObj.search) {
      const params = urlObj.searchParams;
      params.forEach((value, key) => {
        if (key.toLowerCase().includes("redirect") || key.toLowerCase().includes("url"))
          vulnerabilities.push("Open Redirect");
        if (value.includes("<script>") || value.includes("javascript:"))
          vulnerabilities.push("XSS");
        if (value.includes("'") || value.includes('"')) vulnerabilities.push("SQL Injection");
      });
    }
  } catch (error) {
    console.warn(`Invalid URL: ${url}`);
  }
  return vulnerabilities;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === "scanUrls") {
    const allUrls = findUrls();
    allUrls.sort();
    const results = allUrls.map((url) => ({
      url,
      vulnerabilities: detectVulnerabilities(url),
    }));
    sendResponse({ results });
  }
});