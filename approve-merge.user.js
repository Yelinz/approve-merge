// ==UserScript==
// @name        Approve and Merge
// @namespace   Yelinz
// @description Approve and Merge Dependabot Pull Requests on GitHub with one click.
// @author      Yelinz
// @downloadURL https://raw.githubusercontent.com/Yelinz/approve-merge/main/approve-merge.user.js
// @supportURL  https://github.com/Yelinz/approve-merge/issues
// @homepageURL https://github.com/Yelinz/approve-merge

// @match       https://github.com/*

// @grant       GM_addElement
// @grant       GM_getValue
// @grant       GM_setValue

// @version     0.1.1
// ==/UserScript==

const ALLOWED_USERS = new Set(["dependabot"])

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

const HEADER_SELECTOR = ".js-pull-header-details"
const READY_BADGE_SELECTOR = '[reviewable_state="ready"]'
const AUTHOR_SELECTOR = ".author"
function createButton() {
  waitForElement(HEADER_SELECTOR).then((element) => {
    const badge = document.querySelector(READY_BADGE_SELECTOR);
    const author = document.querySelector(AUTHOR_SELECTOR);

    // ignore non ready and non dependabot PRs
    if (!badge || !ALLOWED_USERS.has(author.textContent)) {
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

const REVIEW_SELECTOR = ".js-reviews-toggle"
const REVIEW_APPROVE_SELECTOR = "#pull_request_review\\[event\\]_approve"
const REVIEW_SUBMIT_SELECTOR = "#pull_requests_submit_review .Button--primary"
function approve() {
  const reviewOpen = document.querySelector(REVIEW_SELECTOR);
  reviewOpen.click();
  const reviewOption = document.querySelector(REVIEW_APPROVE_SELECTOR);
  reviewOption.click();
  const reviewSubmit = document.querySelector(REVIEW_SUBMIT_SELECTOR);
  GM_setValue("step", 2);
  reviewSubmit.click();
}

const MERGE_BOX_SELECTOR = '.merge-box-button:not([disabled=""])'
const MERGE_BUTTON_SELECTOR = ".js-merge-commit-button"
function merge() {
  waitForElement(MERGE_BOX_SELECTOR).then((element) => {
    element.click();
    const mergeConfirm = document.querySelector(MERGE_BUTTON_SELECTOR);
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
