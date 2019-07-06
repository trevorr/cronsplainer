const { canonicalCron } = require('cronversant');

function explainCron(cron, { useAMPM } = {}) {
  cron = canonicalCron(cron);
  const { months, daysOfMonth, daysOfWeek, hours, minutes, seconds } = cron;
  const phrases = [];

  const everyMonth = months.wild && !months.step;
  let maxDayOfMonth = 31;
  if (!everyMonth) {
    const { values, step, periods, regular } = months;
    if (step && regular && periods > 2) {
      phrases.push(`every ${step} months starting ${monthNames[values[0]]}`);
    } else {
      phrases.push(`every ${joinSeries(values.map(month => monthNames[month]))}`);
    }
    maxDayOfMonth = values.reduce((prev, curr) => Math.max(prev, daysInMonth[curr]), 0);
  }

  const everyDayOfMonth = daysOfMonth.wild && !daysOfMonth.step;
  const anyDayOfWeek = daysOfWeek.wild && !daysOfWeek.step;
  if (!everyDayOfMonth) {
    const { values, min, max, step, periods } = daysOfMonth;
    let domPhrase;
    if (step && periods * step >= maxDayOfMonth) {
      domPhrase = `every ${step} days`;
      if (!anyDayOfWeek) {
        domPhrase += ` falling ${explainDaysOfWeek(daysOfWeek, false)}`;
      }
      domPhrase += ` starting on the ${ordinal(values[0])} of ${everyMonth ? 'each' : 'the'} month`;
    } else {
      if (step == null && min != null) {
        domPhrase = joinPhrases(!anyDayOfWeek && explainDaysOfWeek(daysOfWeek, true),
          `from the ${ordinal(getValue(min))} through the ${ordinal(getValue(max))} of ${everyMonth ? 'each' : 'the'} month`);
      } else {
        domPhrase = `on the ${joinSeries(values.map(dom => ordinal(dom)))} of ${everyMonth ? 'each' : 'the'} month`;
        if (!anyDayOfWeek) {
          domPhrase += ` falling ${explainDaysOfWeek(daysOfWeek, false)}`;
        }
      }
    }
    phrases.push(domPhrase);
  } else if (!anyDayOfWeek) {
    phrases.push(explainDaysOfWeek(daysOfWeek, true));
  }

  let timePhrase = '';
  let needEveryMinute = false;
  if (seconds.values.length > 1) {
    const { values, min, max, step, periods, regular, wild } = seconds;
    if (step && regular && periods > 2) {
      timePhrase = `every ${step} seconds`;
    } else {
      if (step == null && wild) {
        timePhrase = 'every second';
      } else if (step == null && min != null) {
        timePhrase = `every second from the ${ordinal(getValue(min))} through the ${ordinal(getValue(max))}`;
        needEveryMinute = true;
      } else {
        timePhrase = `at seconds ${joinSeries(values)}`;
        needEveryMinute = true;
      }
    }
  }

  let needEveryHour = false;
  if (minutes.values.length > 1) {
    const { values, min, max, step, periods, regular, wild } = minutes;
    if (step && regular && periods > 2) {
      if (timePhrase) {
        timePhrase += ` of every ${ordinalStep(step)} minute`;
      } else {
        timePhrase = `every ${step} minutes`;
      }
    } else {
      if (step == null && wild) {
        if (!timePhrase) {
          timePhrase = 'every minute';
        } else if (needEveryMinute) {
          timePhrase += ' of every minute';
        }
      } else if (step == null && min != null) {
        if (timePhrase) {
          timePhrase += ' of ';
        }
        timePhrase += `every minute from the ${ordinal(getValue(min))} through the ${ordinal(getValue(max))}`;
        needEveryHour = true;
      } else {
        if (!timePhrase) {
          timePhrase = `at minutes ${joinSeries(values)}`;
        } else {
          timePhrase += ` of minutes ${joinSeries(values)}`;
        }
        needEveryHour = true;
      }
    }
  } else if (timePhrase) {
    timePhrase += ` of the ${ordinal(minutes.values[0])} minute`;
  }

  let needStartTime = true;
  if (hours.values.length > 1) {
    const { values, min, step, periods, regular, wild } = hours;
    if (step && regular && periods > 2) {
      if (timePhrase) {
        timePhrase += ` of every ${ordinalStep(step)} hour`;
      } else {
        timePhrase = `every ${step} hours`;
      }
    } else {
      if (step == null && wild) {
        if (!timePhrase) {
          timePhrase = 'every hour';
        } else if (needEveryHour) {
          timePhrase += ' of every hour';
        }
      } else if (step == null && min != null) {
        if (timePhrase) {
          timePhrase += ' of ';
        }
        timePhrase += `every hour between ${formatTime(values[0], minutes.values[0], seconds.values[0], useAMPM)}` +
          ` and ${formatTime(lastValue(values), lastValue(minutes.values), lastValue(seconds.values), useAMPM)}`;
        needStartTime = false;
      } else {
        if (!timePhrase) {
          timePhrase = `at ${joinSeries(values.map(v => formatTime(v, minutes.values[0], seconds.values[0], useAMPM)))}`;
        } else {
          timePhrase += ` between ${joinSeries(values.map(v =>
            formatTime(v, minutes.values[0], seconds.values[0], useAMPM) + ' to ' +
            formatTime(v, lastValue(minutes.values), lastValue(seconds.values), useAMPM)))}`;
        }
        needStartTime = false;
      }
    }
  } else if (timePhrase) {
    timePhrase += ` from ${formatTime(hours.values[0], minutes.values[0], seconds.values[0], useAMPM)}` +
      ` to ${formatTime(hours.values[0], lastValue(minutes.values), lastValue(seconds.values), useAMPM)}`;
    needStartTime = false;
  }

  if (needStartTime) {
    if (timePhrase) {
      timePhrase += ' starting ';
    }
    timePhrase += `at ${formatTime(hours.values[0], minutes.values[0], seconds.values[0], useAMPM)}`;
  }
  if (everyMonth && everyDayOfMonth && anyDayOfWeek) {
    timePhrase += ' of every day';
  }
phrases.push(timePhrase);

  return phrases.join(', ');
}

function explainDaysOfWeek(daysOfWeek, plural) {
  const { values, min, max, step } = daysOfWeek;
  const prefix = plural ? '' : 'a ';
  const suffix = plural ? 's' : '';
  if (step == null && min != null) {
    const minValue = getValue(min);
    const maxValue = getValue(max);
    if (minValue === 1 && maxValue === 5) {
      return `on ${prefix}weekday${suffix}`;
    } else {
      return `on ${prefix}${dayOfWeekNames[minValue]}${suffix} through ${dayOfWeekNames[maxValue]}${suffix}`;
    }
  } else if (values.length === 2 && getValue(values[0]) === 0 && getValue(values[1]) === 6) {
    return `on ${prefix}weekend${suffix}`;
  } else {
    return `on ${prefix}${joinSeries(values.map(dow => dayOfWeekNames[dow] + suffix), plural ? 'and' : 'or')}`;
  }
}

function formatTime(h, m, s, useAMPM) {
  const pm = h >= 12;
  if (useAMPM) {
    if (h > 12) {
      h -= 12;
    } else if (!h) {
      h = 12;
    }
  }
  let result = `${leadingZero(h)}:${leadingZero(m)}`;
  if (s) {
    result += `:${leadingZero(s)}`;
  }
  if (useAMPM) {
    result += pm ? ' PM' : ' AM';
  }
  return result;
}

function getValue(v) {
  return typeof v === 'number' ? v : v.value;
}

function lastValue(values) {
  return values[values.length - 1];
}

function joinPhrases(a, b, sep = ' ') {
  return a ? b ? `${a}${sep}${b}` : a : b;
}

function joinSeries(arr, conj = 'and') {
  switch (arr.length) {
    case 0:
      return '';
    case 1:
      return arr[0];
    case 2:
      return `${arr[0]} ${conj} ${arr[1]}`;
    default:
      return `${arr.slice(0, -1).join(', ')}, ${conj} ${arr[arr.length - 1]}`;
  }
}

function ordinalStep(n) {
  return n === 2 ? 'other' : ordinal(n);
}

function ordinal(n) {
  switch (n > 20 ? n % 10 : n) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function leadingZero(n) {
  return n < 10 ? `0${n}` : String(n);
}

const monthNames = [
  null,
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const daysInMonth = [
  null,
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];

const dayOfWeekNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

module.exports = explainCron;
