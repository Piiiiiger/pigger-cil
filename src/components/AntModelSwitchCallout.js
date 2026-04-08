function __ccPlaceholder(label) {
  const fn = function () { return __ccPlaceholder(label + '()'); };
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop === Symbol.toPrimitive) return () => label;
      if (prop === 'toString') return () => label;
      if (prop === 'valueOf') return () => label;
      if (prop === Symbol.iterator) return function* () {};
      if (prop === 'length') return 0;
      return __ccPlaceholder(label + '.' + String(prop));
    },
    apply() { return __ccPlaceholder(label + '()'); },
    construct() { return __ccPlaceholder('new ' + label); }
  });
}
export const AntModelSwitchCallout = __ccPlaceholder("AntModelSwitchCallout");
export const shouldShowModelSwitchCallout = __ccPlaceholder("shouldShowModelSwitchCallout");
