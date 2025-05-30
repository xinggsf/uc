const _LANGS = {
	'zh': {},
	'en': {}
};
const _LOCALE = Services.prefs.getCharPref("general.useragent.locale", "zh-CN").split('-')[0];
const LANG = _LANGS[_LOCALE] || _LANGS.en;

function template(a, ...values) {
	let i = 0, key = a.join('').trim().replace(/\s{2,}/g, ' ');
	if (!(key in LANG)) LANG[key] = a.join('%s');
	return LANG[key].replaceAll('%s', x => values[i++]);
}

export const LL = new Proxy(template, {
	// apply(target, ctx, args) {
		// return Reflect.apply(target, ctx, args);
	// },
	get(target, name) {
		if (name === 'debug') return function() {
			console.log(JSON.stringify(LANG));
		}
		if (name === '_data') return LANG;
	}
});
/*
let a='Mike', b=', Tom';
LL`Hello, ${a}${b}`;

class LL {
	static format(s, ...values) {
		let i = 0, key = s.trim().replace(/\s{2,}/g, ' ');
		if (!(key in LANG)) LANG[key] = s;
		return LANG[key].replaceAll('%s', x => values[i++]);
	}
	static to(ss, ...values) {
		return this.format(ss.join('%s'), ...values);
	}
	static get _data() {
		return JSON.stringify(LANG);
	}
}
*/