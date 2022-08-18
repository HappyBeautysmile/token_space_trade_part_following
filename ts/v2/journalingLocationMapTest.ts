import { JournalingLocationMap } from "./journalingLocationMap";

const jlm = new JournalingLocationMap<number>();

jlm.set3(0, 0, 0, 7);
jlm.setMark();
jlm.set3(0, 1, 0, 8);
jlm.set3(0, 0, 0, 9);
jlm.setMark();

console.log(`${jlm.get3(0, 0, 0)} == 9`);
console.log(`${jlm.get3(0, 1, 0)} == 8`);

jlm.undoToMark();
console.log(`${jlm.get3(0, 0, 0)} == 9`);
console.log(`${jlm.get3(0, 1, 0)} == 8`);

jlm.undoToMark();

console.log(`${jlm.get3(0, 0, 0)} == 7`);
console.log(`${jlm.get3(0, 1, 0)} == undefined`);
