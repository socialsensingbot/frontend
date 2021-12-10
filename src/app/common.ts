import {format} from "date-fns";

/**
 * Converts a lower case string to a Title Case String.
 *
 * @param str the lowercase string
 * @returns a Title Case String
 */
export function toTitleCase(str: string): string {
    return str.replace(/\S+/g, repl => repl.charAt(0).toUpperCase() + repl.substr(1).toLowerCase());
}

export const dayInMillis = 24 * 60 * 60 * 1000;
export const hourInMillis = 60 * 60 * 1000;
export const nowRoundedToHour = () => {
    return Math.floor(new Date().getTime() / hourInMillis) * hourInMillis;
};

export function getOS(): "Mac OS" | "iOS" | "Windows" | "Android" | "Linux" | null {
    const userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
        windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
        iosPlatforms = ["iPhone", "iPad", "iPod"];
    let os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = "Mac OS";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = "iOS";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "Windows";
    } else if (/Android/.test(userAgent)) {
        os = "Android";
    } else if (/Linux/.test(platform)) {
        os = "Linux";
    }

    return os;
}

/**
 * Human readable date+time stamp
 */
export function readableTimestamp(): string {
    return format(new Date(), "yyyy_MM_dd@hh.mm.ss");
}


export const roundToHour = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundToMinute = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundToTenMinutes = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(Math.floor(date.getUTCMinutes() / 10) * 10);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundToFiveMinutes = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(Math.floor(date.getUTCMinutes() / 5) * 5);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const sleep = ms => new Promise((resolve) => {
    setTimeout(resolve, ms);
});


export const boundingBoxForGeoJSON = gj => {
    let coords;
    let bbox;
    if (!gj.hasOwnProperty("type")) {
        return;
    }
    coords = getCoordinatesDump(gj);
    bbox = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,];
    return coords.reduce((prev, coord) => [
        Math.min(coord[0], prev[0]),
        Math.min(coord[1], prev[1]),
        Math.max(coord[0], prev[2]),
        Math.max(coord[1], prev[3])
    ], bbox);
};

function getCoordinatesDump(gj) {
    let coords;
    if (gj.type === "Point") {
        coords = [gj.coordinates];
    } else if (gj.type === "LineString" || gj.type === "MultiPoint") {
        coords = gj.coordinates;
    } else if (gj.type === "Polygon" || gj.type === "MultiLineString") {
        coords = gj.coordinates.reduce((dump, part) => dump.concat(part), []);
    } else if (gj.type === "MultiPolygon") {
        coords = gj.coordinates.reduce((dump, poly) => dump.concat(poly.reduce((points, part) => points.concat(part), [])), []);
    } else if (gj.type === "Feature") {
        coords = getCoordinatesDump(gj.geometry);
    } else if (gj.type === "GeometryCollection") {
        coords = gj.geometries.reduce((dump, g) => dump.concat(getCoordinatesDump(g)), []);
    } else if (gj.type === "FeatureCollection") {
        coords = gj.features.reduce((dump, f) => dump.concat(getCoordinatesDump(f)), []);
    }
    return coords;
}
