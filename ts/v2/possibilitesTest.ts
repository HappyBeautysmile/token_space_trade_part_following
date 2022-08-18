import { Possibilities } from "./possibilities";

const m = new Map<number, number>();
m.set(1, 100);
m.set(3, 1);
m.set(2, 10);

const p = new Possibilities(m);

console.log('Should usually be 1,2,3');
for (let i = 0; i < 10; ++i) {
  let a: number[] = [];
  for (const v of p.allItemsInRandomOrder()) {
    a.push(v);
  }
  console.log(`${a.join(',')}`);
}

console.log('All pairs.');
for (const v1 of p.allItemsInRandomOrder()) {
  for (const v2 of p.allItemsInRandomOrder()) {
    console.log(`${v1} -- ${v2}`);
  }
}

const m2 = new Map<number, number>();
m2.set(5, 2);
const p2 = new Possibilities(m2);
console.log(`${p.impossible()} == false`);
console.log(`${p2.impossible()} == false`);
p2.intersectWith(p);
console.log(`${p.impossible()} == false`);
console.log(`${p2.impossible()} == true`);
