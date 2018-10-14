document.querySelectorAll('[data-localize]').forEach(element => {
    let contentId = element.getAttribute('data-localize');
    let message = chrome.i18n.getMessage(contentId);
    if(!!message) {
        element.innerHTML = message;
    } else {
        element.innerHTML = "TRANSLATION ERROR";
    }
});