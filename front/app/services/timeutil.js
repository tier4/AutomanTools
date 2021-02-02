
const locale = navigator.locale;
const dateOption = { timeZoneName: 'short' };


export function timeFormat(date) {
  return new Date(date).toLocaleString(locale, dateOption);
};
export function preTimeFormatter(arr, name) {
  for (let it of arr) {
    it[name] = timeFormat(it[name]);
  }
}



