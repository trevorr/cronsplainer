const { explainCron } = require('../src');
const { parseCron } = require('cronversant');
const chai = require('chai');
const expect = chai.expect;

describe('explainCron', () => {
  it('works', () => {
    expect(explainCron(parseCron('* */3 10-15 */4 mon-fri'))).to.equal(
      'every 4 months starting January, on weekdays from the 10th through the 15th of the month, every minute of every 3rd hour starting at 00:00');
    expect(explainCron(parseCron('* */4 11-21 */6 mon-fri'))).to.equal(
      'every January and July, on weekdays from the 11th through the 21st of the month, every minute of every 4th hour starting at 00:00');
    expect(explainCron(parseCron('* */6 11-21 2,4,6 mon,wed,fri'))).to.equal(
      'every February, April, and June, on Mondays, Wednesdays, and Fridays from the 11th through the 21st of the month, every minute of every 6th hour starting at 00:00');
    expect(explainCron(parseCron('* */8 15,31 */5 sat,sun'))).to.equal(
      'every January, June, and November, on the 15th and 31st of the month falling on a weekend, every minute of every 8th hour starting at 00:00');
    expect(explainCron(parseCron('*/3 1-23/8 15,31 2 tue,thu'))).to.equal(
      'every February, on the 15th and 31st of the month falling on a Tuesday or Thursday, every 3 minutes of every 8th hour starting at 01:00');
    expect(explainCron(parseCron('*/3 9,21 15,31 * tue,thu'))).to.equal(
      'on the 15th and 31st of each month falling on a Tuesday or Thursday, every 3 minutes between 09:00 to 09:57 and 21:00 to 21:57');
    expect(explainCron(parseCron('* */2 */3 * *'))).to.equal(
      'every 3 days starting on the 1st of each month, every minute of every other hour starting at 00:00');
    expect(explainCron(parseCron('* */2 */3 */6 *'))).to.equal(
      'every January and July, every 3 days starting on the 1st of the month, every minute of every other hour starting at 00:00');
    expect(explainCron(parseCron('* */2 */3 * mon-fri'))).to.equal(
      'every 3 days falling on a weekday starting on the 1st of each month, every minute of every other hour starting at 00:00');
    expect(explainCron(parseCron('*/2 */2 * * mon-fri'))).to.equal(
      'on weekdays, every 2 minutes of every other hour starting at 00:00');
    expect(explainCron(parseCron('30 17 * * mon-fri'), { useAMPM: true })).to.equal(
      'on weekdays, at 05:30 PM');
    expect(explainCron(parseCron('10-20 17-19 * * mon-fri'), { useAMPM: true })).to.equal(
      'on weekdays, every minute from the 10th through the 20th of every hour between 05:10 PM and 07:20 PM');
    expect(explainCron(parseCron('*/5 12 * * sat,sun'), { useAMPM: true })).to.equal(
      'on weekends, every 5 minutes from 12:00 PM to 12:55 PM');
    expect(explainCron(parseCron('0 3,7,15 * * mon-fri'), { useAMPM: true })).to.equal(
      'on weekdays, at 03:00 AM, 07:00 AM, and 03:00 PM');
    expect(explainCron(parseCron('*/2 3,7,15 * * mon-fri'), { useAMPM: true })).to.equal(
      'on weekdays, every 2 minutes between 03:00 AM to 03:58 AM, 07:00 AM to 07:58 AM, and 03:00 PM to 03:58 PM');
    expect(explainCron(parseCron('@yearly'), { useAMPM: true })).to.equal(
      'every January, on the 1st of the month, at 12:00 AM');
    expect(explainCron(parseCron('@daily'), { useAMPM: true })).to.equal(
      'at 12:00 AM of every day');
    expect(explainCron(parseCron('@hourly'), { useAMPM: true })).to.equal(
      'every hour starting at 12:00 AM of every day');
    expect(explainCron(parseCron('* * * * *'))).to.equal(
      'every minute starting at 00:00 of every day');
    expect(explainCron(parseCron('* * * * * *', { withSeconds: true }))).to.equal(
      'every second starting at 00:00 of every day');
  });
});
