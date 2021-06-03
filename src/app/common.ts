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

