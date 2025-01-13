document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.getElementById("results");
  const currentDomain = window.location.hostname;

  // Send a message to the content script to scan URLs
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, "scanUrls", (response) => {
      if (chrome.runtime.lastError) {
        resultsContainer.innerHTML = `<div style="color:#ff6666;">Error: ${chrome.runtime.lastError.message}</div>`;
        return;
      }

      const allUrls = response.results;
      resultsContainer.innerHTML = `
        <div style="margin:10px 0;color:#00ff00">✅ Found ${allUrls.length} URLs & Endpoints on ${currentDomain}</div>
        <div style="background:#2a2a2a;padding:10px;border-radius:5px;max-height:200px;overflow-y:auto;">
          ${allUrls
            .map(({ url, vulnerabilities }) => {
              return `
                <div class="url-item">
                  ${url}
                  ${
                    vulnerabilities.length > 0
                      ? `<div class="vulnerability">Potential: ${vulnerabilities.join(", ")}</div>`
                      : ""
                  }
                </div>`;
            })
            .join("")}
        </div>
      `;
    });
  });

  // Close button
  document.getElementById("closeWidget").onclick = () => {
    window.close();
  };

  // Download URLs button
  document.getElementById("downloadUrls").onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, "scanUrls", (response) => {
        const allUrls = response.results.map((result) => result.url);
        const blob = new Blob([allUrls.join("\n")], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `urls-${currentDomain}.txt`;
        link.click();
      });
    });
  };

  // Copy URLs button
  document.getElementById("copyUrls").onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, "scanUrls", (response) => {
        const allUrls = response.results.map((result) => result.url);
        navigator.clipboard
          .writeText(allUrls.join("\n"))
          .then(() => alert("URLs copied to clipboard!"))
          .catch(() => alert("Failed to copy URLs."));
      });
    });
  };
});