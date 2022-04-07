export const MAX_DATE = "16-Sept-21";
export const TS_SELECTED_MIN_DATE = "14-Sept-21";
export const TS_SELECTED_MIN_TIME = "00 am";
export const MIN_DATE = "11-Sept-21";
export const MAX_DATE_MILLIS = 1631664000000;
export const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
export const MIN_DATE_MILLIS = MAX_DATE_MILLIS - ONE_DAY_MILLIS;

import * as Diff from "diff";

require('colors');
export const sortedStringify = (unordered) => {
    const ordered = Object.keys(unordered).sort().reduce(
        (obj, key) => {
            obj[key] = unordered[key];
            return obj;
        },
        {}
    );
    return JSON.stringify(ordered);
};


export const diffStrings = (a, b) => {
    const diff = Diff.diffChars(a, b);
    diff.forEach((part) => {
        // green for additions, red for deletions
        // grey for common parts
        const color = part.added ? 'green' :
            part.removed ? 'red' : 'grey';
        process.stderr.write(part.value[color]);
    });

    console.log();
}
