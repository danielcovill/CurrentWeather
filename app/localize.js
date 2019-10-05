document.querySelectorAll('[data-localize-field]').forEach(element => {
	let contentId = element.getAttribute('data-localize-value');
	let fieldToLocalize = element.getAttribute('data-localize-field');
	let message = chrome.i18n.getMessage(contentId);
	if (!!message) {
		element.setAttribute(fieldToLocalize, message);
	} else {
		console.error("Translation error");
	}
});
// This way is redundant, but makes the HTML cleaner because it's what I'm doing most of the time
document.querySelectorAll('[data-localize]').forEach(element => {
	let contentId = element.getAttribute('data-localize');
	let message = chrome.i18n.getMessage(contentId);
	if (!!message) {
		element.innerHTML = message;
	} else {
		console.error("Translation error");
	}
});