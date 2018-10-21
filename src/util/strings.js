/* EXCEPTIONS TO ESLINT RULES FOR THIS MODULE:                                */
/*                                                                            */
/* eslint-disable import/prefer-default-export                                */
/* This module will be a library and should not have a default export.  Other */
/* functions will be added in time.                                           */


/*
 * Return copy of strim trimmed to target length with the middle of the string
 * substituted with the characters provided
 *
 * @param {*} string        String to be trimmed
 * @param {*} targetLength  Target length
 * @param {*} substitution  Charaters to show / subtitute in middle - can be
 *                          blank.
 * @returns                 Trimmed string
 */
export function middleTrim(string, targetLength, substitution = '...') {
  let trimmed;
  if (string.length <= targetLength) {
    // Do not trim
    trimmed = string;
  } else {
    const sideLength = Math.floor((targetLength - substitution.length) / 2);
    const leftSide = string.substring(0, sideLength);
    const rightSide = string.substring(string.length - sideLength);
    trimmed = `${leftSide}${substitution}${rightSide}`;
  }

  return trimmed;
}
