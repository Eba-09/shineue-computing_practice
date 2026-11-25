// Exercise sets, one file per lesson. To add a lesson: create content/exercises/<lessonId>.js
// (copy any file here as a template) and add one line below.
import g6_25 from './g6-25';
import g6_26 from './g6-26';
import g7_x13 from './g7-x13';
import g7_x14 from './g7-x14';
import g8_23 from './g8-23';
import g8_24 from './g8-24';

const sets = [g6_25, g6_26, g7_x13, g7_x14, g8_23, g8_24];

export default Object.fromEntries(sets.map((s) => [s.lessonId, s]));
