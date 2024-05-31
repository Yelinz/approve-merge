// ==UserScript==
// @name        Approve and Merge
// @namespace   Violentmonkey Scripts
// @match       https://github.com/*
// @grant       GM_addElement
// @grant       GM_getValue
// @grant       GM_setValue
// @version     1.0
// @author      Yelinz
// @description 5/28/2024, 4:57:03 PM
// ==/UserScript==

function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function createButton() {
  waitForElement(".js-pull-header-details").then((element) => {
    const badge = document.querySelector('[reviewable_state="ready"]');
    const author = document.querySelector(".author");

    // ignore non ready and non dependabot PRs
    if (!badge || author.textContent !== "dependabot") {
      return;
    }

    const button = GM_addElement(element, "button", {
      textContent: "Approve and Merge",
    });
    button.addEventListener("click", () => {
      GM_setValue("step", 1);
      window.location.replace(location.pathname + "/files");
    });
  });
}

function approve() {
  const reviewOpen = document.querySelector(".js-reviews-toggle");
  reviewOpen.click();
  const reviewOption = document.querySelector(
    "#pull_request_review\\[event\\]_approve",
  );
  reviewOption.click();
  const reviewSubmit = document.querySelector(
    "#pull_requests_submit_review .Button--primary",
  );
  GM_setValue("step", 2);
  reviewSubmit.click();
}

function merge() {
  waitForElement('.merge-box-button:not([disabled=""])').then((element) => {
    element.click();
    const mergeConfirm = document.querySelector(".js-merge-commit-button");
    mergeConfirm.click();
    GM_setValue("step", 0);
    window.location.replace(location.pathname.split("pull")[0] + "pulls");
  });
}

function onUrlChange() {
  const splitPath = location.pathname.split("/");
  if (splitPath.length !== 5 && splitPath[3] !== "pull") {
    return;
  }

  try {
    const step = GM_getValue("step", 0);

    if (step === 0) {
      createButton();
    } else if (step === 1) {
      approve();
    } else if (step === 2) {
      merge();
    }
  } catch (e) {
    console.error(e);
    GM_setValue("step", 0);
  }
}

onUrlChange();

if (self.navigation) {
  navigation.addEventListener("navigatesuccess", onUrlChange);
} else {
  let u = location.href;
  new MutationObserver(
    () => u !== (u = location.href) && onUrlChange(),
  ).observe(document, { subtree: true, childList: true });
}
