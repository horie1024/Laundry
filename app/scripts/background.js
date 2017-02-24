// Enable chromereload by uncommenting this line:
//import 'chromereload/devonly';

const axios = require('axios');
const clientId = "";
const clientSecret = "";
const qiitaUrl = `https://qiita.com/api/v2/oauth/authorize?client_id=${clientId}&scope=write_qiita_team+read_qiita_team`

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.greeting == "hello") {
    execOAuthFlow();
    sendResponse({farewell: "start OAuth"});
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.pageAction.show(tabId);
});

let execOAuthFlow = () => {
  chrome.identity.launchWebAuthFlow({
    "url": qiitaUrl,
    "interactive": true
  }, (responseUrl) => {
    var newUrl = new URL(responseUrl);
    axios.defaults.headers.post['Content-Type'] = 'application/json';
    axios.post("https://qiita.com/api/v2/access_tokens", {
      "client_id": clientId,
      "client_secret": clientSecret,
      "code": newUrl.searchParams.get('code')
    }).then((res) => {
      chrome.storage.local.set({token: res.data.token});
    });
  });
};
