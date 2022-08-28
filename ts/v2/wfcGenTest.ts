import { AllRuleBuilder, RuleBuilder } from "./ruleBuilder";
import { WFCGen } from "./wfcGen";

const builder = new AllRuleBuilder();

builder.add3(1, 1, 0, 0, 1);
builder.add3(1, -1, 0, 0, 1);
builder.add3(1, 1, 0, 0, 2);
builder.add3(1, -1, 0, 0, 2);
builder.add3(2, 1, 0, 0, 0);
builder.add3(2, -1, 0, 0, 0);
builder.add3(2, 1, 0, 0, 1);
builder.add3(2, -1, 0, 0, 1);

const gen = new WFCGen(10);

for (const [center, rule] of builder.buildRules()) {
  console.log(`${center} size: ${rule.getSize()}`);
  gen.rules.set(center, rule);
}

gen.build();
