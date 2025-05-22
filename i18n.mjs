const _LANGS = {
	'zh': {},
	'en': {}
};
const _LOCALE = Services.prefs.getCharPref("general.useragent.locale", "zh-CN").split('-')[0];
const LANG = _LANGS[_LOCALE] || _LANGS.en;

export function format(s, ...values) {
	let i = 0, key = s.trim().replace(/\s{2,}/g, ' ');
	if (!(key in LANG)) LANG[key] = s;
	return LANG[key].replaceAll('%s', x => values[i++]);
}

export const LL = new Proxy(format, {
	apply(target, ctx, args) {
		args[0] = args[0].join('%s');
		return Reflect.apply(target, ctx, args);
	},
	get(target, name) {
		if (name === '_data') return JSON.stringify(LANG);
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