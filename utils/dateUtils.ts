import { Timestamp } from 'firebase/firestore';
import moment from 'moment';

const repetitionDayMap = {
    'Daily': 1,
    'Every Other Day': 2,
    'Every Three Days': 3,
    'Weekly': 7,
    'Other': 1,
}

export const momentToTimestamp = (momentObj: moment.Moment) => {
    return Timestamp.fromDate(momentObj.toDate());
};

export const timestampToMoment = (timestamp: Timestamp) => {
    return moment(timestamp.toDate());
};

export const medicationDueOnDate = (startDate: moment.Moment, endDate: moment.Moment, frequency: string, date?: moment.Moment) => {
    if (!date) {
        date = moment().startOf('day');
    }
    if (startDate.isAfter(date) || endDate.isBefore(date)) { // could use .isBetween
        return false
    }
    if (frequency === "Monthly") {
        if (date.date() === startDate.date()) {
            return true
        } 
    } else if (repetitionDayMap.hasOwnProperty(frequency)) {
        const daysDiff = date.diff(startDate, 'days');
        const key = frequency as keyof typeof repetitionDayMap;
        const repetitionDays = repetitionDayMap[key];
        if (daysDiff % repetitionDays === 0) {
            return true;
        }
    } else {
        return false;
    }
}